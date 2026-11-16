"""Pure synthetic geometry and security tests, NOT real DWD-image evidence."""
import hashlib
import json
import struct
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from ir108_original_probe import NATIVE_GRID
from qa_ruc_same_run_preview import (
    COORDS, GRID_FILENAME, GeoPreviewError, coordinate_source,
    read_coordinate_grib, qa_lookup_manifest,
)

RUN="2026-11-16T08:00:00Z"

class Response:
    status=200
    def __init__(self,url,payload):
        self.url,self.payload=url,payload
        self.headers={"Content-Length":str(len(payload))}
    def geturl(self):
        return self.url
    def read(self,limit):
        return self.payload[:limit]
    def __enter__(self):
        return self
    def __exit__(self,*args):
        return False

class Opener:
    def __init__(self,body,filename=GRID_FILENAME,wrong_url=False):
        self.body,self.filename,self.wrong_url=body,filename,wrong_url
        self.requested=[]
    def open(self,request,timeout):
        url=request.full_url
        self.requested.append(url)
        if url.endswith("/s/"):
            return Response(url,(f'<html><a href="{self.filename}">file</a></html>').encode())
        return Response("https://example.invalid/wrong" if self.wrong_url else url,self.body)

def origin(param):
    url=coordinate_source(param,RUN)[1]
    return {"sha256":"a"*64,"sourceUrl":url,"bytes":100}

class SameRunTests(unittest.TestCase):
    def test_exact_official_coordinates_only(self):
        for param in COORDS:
            base, exact=coordinate_source(param,RUN)
            self.assertEqual(exact,base+GRID_FILENAME)
            self.assertTrue(exact.startswith("https://opendata.dwd.de/"))
            self.assertIn("r/2026-11-16T08%3A00/s/",exact)
        for p in ("CLCT","SYNMSG_BT_CL_IR10.8","CLON/../CLAT"):
            with self.assertRaises(GeoPreviewError):
                coordinate_source(p,RUN)
    def test_real_bytes_are_not_passed_without_same_run_official_index(self):
        raw=b"GRIB"+b"x"*100+b"7777"
        opener=Opener(raw)
        self.assertEqual(read_coordinate_grib("CLAT",RUN,opener)[0],raw)
        self.assertEqual(len(opener.requested),2)
        for candidate in (
            Opener(raw,filename="PT001H00M.grib2"),
            Opener(raw,wrong_url=True),
            Opener(b"bad data"*20),
            Opener(b"GRIB"+b"x"*99+b"7777"),
        ):
            # A small, structurally valid GRIB envelope isn't a *decode*
            # success; it must still pass later actual ecCodes checks.
            if candidate.body.startswith(b"GRIB") and candidate.filename==GRID_FILENAME and not candidate.wrong_url:
                continue
            with self.assertRaises(GeoPreviewError):
                read_coordinate_grib("CLON",RUN,candidate)
    def test_private_manifest_is_sha_bound_and_explicitly_unapproved(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            raw=b"".join(struct.pack("<I",n) for n in (0,0xffffffff,1,2))
            (root/"lookup.bin").write_bytes(raw)
            grid={"nx":2,"ny":2,"lonMin":7.0,"latMin":50.0,
                  "dx":.025,"dy":.025,"maxNearestKm":3.0,
                  "nativePointCount":NATIVE_GRID[3]}
            source={p:origin(p) for p in COORDS}
            m=qa_lookup_manifest(root,RUN,grid,source)
            self.assertTrue(m["qaOnly"])
            self.assertFalse(m["productionApproved"])
            self.assertEqual(m["pointCount"],542040)
            self.assertEqual(m["objects"]["lookup.bin"]["sha256"],hashlib.sha256(raw).hexdigest())
            altered={**source,"CLAT":{**source["CLAT"],"sourceUrl":"https://other.invalid/"}}
            with self.assertRaises(GeoPreviewError):
                qa_lookup_manifest(root,RUN,grid,altered)
            bad={**grid,"nativePointCount":123}
            with self.assertRaises(GeoPreviewError):
                qa_lookup_manifest(root,RUN,bad,source)
            (root/"lookup.bin").write_bytes(raw[:-1])
            with self.assertRaises(GeoPreviewError):
                qa_lookup_manifest(root,RUN,grid,source)
    def test_no_visual_claim_from_private_sidecar(self):
        # The original 10-image renderer owns its negative/positive tests.
        # This test checks that a private coordinate manifest is not a
        # production snapshot merely because it uses the same wire schema.
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            (root/"lookup.bin").write_bytes(b"\xff\xff\xff\xff"*4)
            grid={"nx":2,"ny":2,"nativePointCount":NATIVE_GRID[3]}
            meta=qa_lookup_manifest(root,RUN,grid,{p:origin(p) for p in COORDS})
            self.assertFalse(meta["productionApproved"])
            self.assertEqual(meta["provenance"],
                             "real DWD CLAT/CLON same-run ORIGINAL GRIB, private shadow")

if __name__=="__main__":
    unittest.main()
