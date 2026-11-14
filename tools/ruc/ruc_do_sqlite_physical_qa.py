#!/usr/bin/env python3
"""MID RUC: offline SQLite physical-volume and grouped range-read probe.

AUTHENTIC size and range-index metadata from a SHA-pinned original-DWD QA
archive; SYNTHETIC content of precisely equal byte lengths. No Cloudflare,
network, tokens, billable storage or production changes. Host SQLite WAL is
not a real Durable Object storage/billing/CPU measurement.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import sqlite3
import tempfile
import time
import zipfile
from pathlib import Path

PROOF_SHA256 = "28ed26fe81a29dc74d0360db1a822446dd29479eed1d07ef21ba9f74e68433c1"
STABLE_SOURCE_SHA = "d8852f672a40d26348d214dc85e9a3a1b9d79c1f"
SOURCE_RUN = "2026-11-09T14:00"
PACK_BYTES = 672790506
POINTS = 542040
SEGMENT = 4000000
SAMPLED_CELLS = (0, 1, 7, 47, 1704, 271020, 542039)
MAX_INTERNAL_PER_RUN = 900000000
MAX_INTERNAL_ACCOUNT = 4500000000


def file_digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for item in iter(lambda: f.read(1048576), b""):
            h.update(item)
    return h.hexdigest()


def source(proof: Path):
    if file_digest(proof) != PROOF_SHA256:
        raise ValueError("original GitHub artifact SHA drift")
    with zipfile.ZipFile(proof) as z:
        inventory = json.loads(z.read("inventory.json"))
        index = json.loads(z.read("range-index.json"))
        parity = json.loads(z.read("consumer-parity.json"))
    if (inventory.get("schema") != "mid.ruc.r2.offline-inventory.v1" or
        inventory.get("run") != SOURCE_RUN or
        inventory.get("stableSha") != STABLE_SOURCE_SHA or
        inventory.get("timeCount") != 28 or inventory.get("epsMemberCount") != 20 or
        inventory.get("nativeEpsMemberObjectsIncluded") is not True or
        index.get("sourcePointCount") != POINTS or
        index.get("run") != SOURCE_RUN or
        index.get("sourceManifestSha256") != "0615621952c3c07ebd5d60cfc2e0a44596198a244a75824b58d6b0a7419830ca" or
        parity.get("allPointBytesMatchOriginal") is not True or
        parity.get("sampledNativeCells") != list(SAMPLED_CELLS)):
        raise ValueError("original 27h/EPS20 provenance mismatch")
    sizes = {entry["key"]: entry["bytes"] for entry in inventory["objects"]}
    if len(sizes) != 14 or sum(sizes.values()) != PACK_BYTES or len(index["entries"]) != 12:
        raise ValueError("incomplete original packed-object inventory")
    for item in index["entries"]:
        if sizes.get(item["compressedKey"]) != item["compressedBytes"]:
            raise ValueError("range index/object byte length mismatch")
    return sizes, index, parity


def fake_bytes(name: str, part: int, size: int) -> bytes:
    """Same *size*, NOT the meteorological content. SQLite doesn't compress."""
    seed = hashlib.sha512(("synthetic DO volume:"+name+":"+str(part)).encode()).digest()
    return (seed * (size // 64 + 1))[:size]


def sqlite_range(conn: sqlite3.Connection, sizes: dict, key: str, offset: int, length: int):
    if (key not in sizes or type(offset) is not int or type(length) is not int or
        offset < 0 or length <= 0 or length > 4*1024*1024 or
        offset+length > sizes[key]):
        raise ValueError("unbounded or invalid SQL range")
    total = bytearray()
    reads = 0
    while len(total) < length:
        o = offset+len(total)
        part, skip = divmod(o, SEGMENT)
        take = min(SEGMENT-skip, length-len(total))
        row = conn.execute("SELECT substr(payload,?,?) FROM segment WHERE name=? AND part=?",
                           (skip+1,take,key,part)).fetchone()
        if row is None or len(row[0]) != take:
            raise ValueError("missing or truncated SQL segment")
        expected = fake_bytes(key,part,min(SEGMENT,sizes[key]-part*SEGMENT))[skip:skip+take]
        if row[0] != expected:
            raise ValueError("synthetic SQL payload mismatch")
        total.extend(row[0])
        reads += 1
    return bytes(total), reads


def file_sizes(db: Path):
    def size(p):
        try: return p.stat().st_size
        except FileNotFoundError: return 0
    return (size(db),size(Path(str(db)+"-wal")),size(Path(str(db)+"-shm")))


def measure(proof: Path):
    sizes,index,parity=source(proof)
    t0=time.monotonic()
    with tempfile.TemporaryDirectory(prefix="mid-ruc-sqlite-volume-") as temp:
        db=Path(temp)/"model-run.db"
        cn=sqlite3.connect(db)
        try:
            cn.execute("PRAGMA page_size=4096")
            if cn.execute("PRAGMA journal_mode=WAL").fetchone()[0]!="wal":
                raise ValueError("WAL unavailable")
            cn.execute("PRAGMA synchronous=FULL")
            cn.execute("PRAGMA wal_autocheckpoint=1000")
            cn.execute("CREATE TABLE segment(name TEXT NOT NULL,part INTEGER NOT NULL,payload BLOB NOT NULL,PRIMARY KEY(name,part)) WITHOUT ROWID")
            cn.commit()
            peak={"db":0,"wal":0,"shm":0,"combined":0}
            rows=0
            for key,size in sorted(sizes.items()):
                for part,offset in enumerate(range(0,size,SEGMENT)):
                    length=min(SEGMENT,size-offset)
                    cn.execute("INSERT INTO segment VALUES(?,?,?)",(key,part,fake_bytes(key,part,length)))
                    cn.commit()  # deliberately bounded per-4MB transactions
                    rows+=1
                    a,b,c=file_sizes(db)
                    peak={k:max(peak[k],v) for k,v in zip(peak,(a,b,c,a+b+c))}
                    if a+b+c>MAX_INTERNAL_PER_RUN:
                        raise ValueError("one-DO internal disk/WAL peak exceeded")
            if rows!=177 or cn.execute("SELECT count(*) FROM segment").fetchone()[0]!=rows:
                raise ValueError("source rows lost")
            calls,reads=0,0
            for cell in SAMPLED_CELLS:
                count=0
                for entry in index["entries"]:
                    if (not entry["name"].endswith(".bin") or entry["recordBytes"]<=1 or
                        entry["sourceBytes"] != POINTS*entry["recordBytes"]):
                        continue
                    pos=cell*entry["recordBytes"]
                    raw_start=0
                    selected=None
                    for chunk in entry["chunks"]:
                        if raw_start<=pos and pos+entry["recordBytes"]<=raw_start+chunk["rawBytes"]:
                            selected=chunk
                            break
                        raw_start+=chunk["rawBytes"]
                    if selected is None:
                        raise ValueError("native point crosses independent block")
                    _,n=sqlite_range(cn,sizes,entry["compressedKey"],selected["offset"],selected["bytes"])
                    count+=1
                    reads+=n
                if count!=10:
                    raise ValueError("original DWD native point-products missing")
                calls+=1  # virtual batching, NOT a real DO RPC
            cn.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            db_bytes=file_sizes(db)[0]
            if cn.execute("PRAGMA integrity_check").fetchone()[0]!="ok":
                raise ValueError("SQLite integrity failure")
            result={
                "schema":"mid.ruc.do-free.host-sqlite-volume-qa.v1",
                "sourceModelRun":SOURCE_RUN,"sourceStableSha":STABLE_SOURCE_SHA,
                "verifiedProofZipSha256":PROOF_SHA256,
                "verifiedSourcePackedBytes":PACK_BYTES,"actualDwdPayloadStored":False,
                "syntheticByteLengthsMatchOriginal":True,
                "localSqliteVersion":sqlite3.sqlite_version,
                "sqliteSegmentBytes":SEGMENT,"rowsPerRun":rows,
                "hostDbBytesAfterCheckpoint":db_bytes,
                "hostPeakDbWalShmBytes":peak["combined"],
                "hostPeakComponentsBytes":peak,
                "fiveRunProjectedDbBytes":db_bytes*5,
                "fiveRunProjectedPeakBytes":peak["combined"]*5,
                "oneDbBelow1GbFreeLimit":db_bytes<1000000000,
                "hostPeakBelow900MbInternalLimit":peak["combined"]<MAX_INTERNAL_PER_RUN,
                "projectedFivePeakBelow4_5GbInternalLimit":peak["combined"]*5<MAX_INTERNAL_ACCOUNT,
                "sampleCells":list(SAMPLED_CELLS),
                "matchedSyntheticBinaryPointProducts":parity["checkedNativeProductRecords"],
                "batchedDoRpcCountOnlySimulated":calls,
                "sqlRowsReadBySimulatedBatch":reads,
                "hostProbeSeconds":round(time.monotonic()-t0,2),
                "realCloudflareStorageMetered":False,"cloudflareFreePlanVerified":False,
                "realDOConcurrencyAndCpuVerified":False,"productionApproved":False,
                "activationAuthorized":False,
                "limitations":[
                    "Host SQLite and WAL peaks are not Cloudflare SQLite storage accounting",
                    "Five complete model-run databases are extrapolated, not physically built",
                    "Only synthetic bytes match the historical original object sizes; actual DWD SHA was proven in earlier offline codec QA",
                    "One batched DO request per point is simulated, not an actual Cloudflare RPC",
                    "No network, secret, Cloudflare API, subscription or production publish"
                ]
            }
            return result
        finally:
            cn.close()


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--proof-zip",type=Path,required=True)
    parser.add_argument("--report",type=Path,required=True)
    args=parser.parse_args()
    try:
        result=measure(args.proof_zip)
        args.report.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n",encoding="utf-8")
        print(json.dumps(result,sort_keys=True))
    except (OSError,ValueError,sqlite3.Error,zipfile.BadZipFile) as e:
        print(json.dumps({"productionApproved":False,"activationAuthorized":False,
                          "errorType":type(e).__name__,"reason":str(e)}))
        raise SystemExit(2)
