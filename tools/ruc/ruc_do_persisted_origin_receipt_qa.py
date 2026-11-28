#!/usr/bin/env python3
"""Offline verification of a pinned historical DWD QA proof receipt.

The SOURCE proof ZIP was successfully checked in Actions #42798390928.
This retained record is byte-bound to that prior run, but is NOT a new
inspection of the original DWD payload or a trusted production CI signer.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

PINNED_RECEIPT_GIT_BLOB = "698491e125300f4c867fde0de4ebcc47143e841b"
EXPECTED_SOURCE_RUN = "2026-11-09T14:00"
EXPECTED_PRODUCER_SHA = "d8852f672a40d26348d214dc85e9a3a1b9d79c1f"
EXPECTED_SOURCE_ARTIFACT = "5a2275e4d75497c08e400b6e6b899254def2330a1b22472fe676d2cf112efe43"
EXPECTED_RECEIPT_SHA = "28ed26fe81a29dc74d0360db1a822446dd29479eed1d07ef21ba9f74e68433c1"
EXPECTED_OBJECT_DIGESTS = {
    "report.json": "540bf9ebb9c335a06d8df782f7b48f6774d8c2ca32d48d2823e68f5adff38d61",
    "inventory.json": "e74422fccba6378be519a7e4ee6b57bd0f0812a6bc8853f4a40b16196d323f42",
    "range-index.json": "0b5b06b846affab6d08ece9b1aeaa05f5a24a5064c26054248066a0880f998a4",
    "consumer-parity.json": "3fc37b9f98d43ae97f1bafa93acb805abaf34f5a92394deafeb8aefee0632351",
}


def read_retained_receipt(file: Path) -> dict:
    if file.is_symlink() or not file.is_file() or file.stat().st_size > 10_000:
        raise ValueError("missing/unsafe retained original proof receipt")
    b = file.read_bytes()
    blob = hashlib.sha1(b"blob " + str(len(b)).encode("ascii") + b"\0" + b).hexdigest()
    if blob != PINNED_RECEIPT_GIT_BLOB:
        raise ValueError("historical evidence Git blob SHA changed")
    j = json.loads(b)
    evidence = j.get("evidenceSource") or {}
    expected = {
        "schema": "mid.ruc.do.persisted-historical-proof-qa.v1",
        "originalModelRun": EXPECTED_SOURCE_RUN,
        "originalProducerSha": EXPECTED_PRODUCER_SHA,
        "originalSourceArtifactSha256": EXPECTED_SOURCE_ARTIFACT,
        "originalSourceManifestSha256": "0615621952c3c07ebd5d60cfc2e0a44596198a244a75824b58d6b0a7419830ca",
        "nativeLeadHours": 27,
        "nativeEPSMembers": 20,
        "sourcePointCount": 542040,
        "originalObjectCount": 12,
        "originalBytesPreviouslyVerified": 1999624596,
        "losslesslyPackedBytesPreviouslyVerified": 672790506,
        "independentOriginalPointRecordsPreviouslyCompared": 70,
        "historicalProofMetadataPreviouslyChecked": True,
        "historicalProofMetadataPinnedAndCheckedNow": False,
        "sourceChecksRecomputedFromOriginalBytesNow": False,
        "dwdOfficialSignatureVerified": False,
        "midCiTrustedIssuerKeyConfigured": False,
        "actualOriginalDwdBytesSignedHere": False,
        "productionApproved": False,
        "activationAuthorized": False,
    }
    for key, value in expected.items():
        if type(j.get(key)) is not type(value) or j.get(key) != value:
            raise ValueError("stale/forged/unsafe historical source receipt: " + key)
    if (evidence.get("archiveGitHubActionsRunId") != 42780229524 or
        evidence.get("archiveArtifactId") != 13746075942 or
        evidence.get("archiveZipSha256") != EXPECTED_RECEIPT_SHA or
        evidence.get("verifiedByGitHubActionsRunId") != 42798390928 or
        evidence.get("verifiedOnQaHeadSha") != "b74884e1f2bf6da421dbe25bf0ee544d1334ffe6" or
        evidence.get("originalFullDwdQaRunIds") != [42778833523,42780229524] or
        evidence.get("extractedJsonSha256") != EXPECTED_OBJECT_DIGESTS):
        raise ValueError("untrusted underlying original GitHub source proof")
    return j


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--receipt", required=True, type=Path)
    opts = p.parse_args()
    try:
        data = read_retained_receipt(opts.receipt)
        print(json.dumps({
            "schema": "mid.ruc.do.persisted-receipt-readback.v1",
            "originalRun": data["originalModelRun"],
            "priorGitHubEvidenceVerified": True,
            "actualOriginalDwdBytesRehashedNow": False,
            "productionApproved": False,
            "activationAuthorized": False,
        }, sort_keys=True))
        return 0
    except (OSError, ValueError, TypeError, json.JSONDecodeError) as exc:
        print(json.dumps({"productionApproved": False, "activationAuthorized": False,
                          "errorClass": type(exc).__name__, "reason": str(exc)}))
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
