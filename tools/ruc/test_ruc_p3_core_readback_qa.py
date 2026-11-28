#!/usr/bin/env python3
"""Offline negative and positive sealed-core *post-quantization* EPS shadow."""
from __future__ import annotations
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
import warnings

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from build_ruc_bundle import eps_summary
from ruc_pack import EPS_SUMMARY_FIELDS, pack_cell_major, pack_eps_members
from prepared_snapshot import core_report
from ruc_p3_core_readback_qa import assess, verify_checkpoint

SHA = 'a'*40
RUN = '2026-11-08T18:00'


def fixture(folder: Path, *, points: int = 37):
    rng = np.random.default_rng(541)
    cube = rng.gamma(1.5, 3.2, size=(28, 20, points))
    cube[:, :, 0] = np.nan
    cube[:, :, 1] = 0.
    cube[0, 1, 2] = np.inf
    cube[0, 2, 3] = -np.inf
    start = datetime.strptime(RUN, '%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    times = [(start + timedelta(hours=h)).strftime('%Y-%m-%dT%H:%M') for h in range(28)]
    with warnings.catch_warnings():
        warnings.simplefilter('ignore', RuntimeWarning)
        summary = eps_summary(cube)
    members = pack_eps_members(cube, .01)
    summaries = pack_cell_major(summary, EPS_SUMMARY_FIELDS)
    (folder / 'eps-members.bin').write_bytes(members)
    (folder / 'eps-summary.bin').write_bytes(summaries)
    inventory = {
        name: {'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
        for name, raw in (('eps-members.bin', members),
                          ('eps-summary.bin', summaries))
    }
    meta = {
        'schema':'mid.dwd.ruc.grid.v2', 'run':RUN, 'pointCount':points,
        'deterministic':{'times':times},
        'eps':{
            'key':'runs/2026-11-08T1800/eps-members.bin',
            'dtype':'uint16-le','layout':'point-time-member','times':times,
            'unit':'mm','scale':.01,'nodata':65535,
            'memberCount':20,'recordBytes':28*20*2,
        },
        'epsSummary':{
            'key':'runs/2026-11-08T1800/eps-summary.bin',
            'dtype':'int16-le','layout':'point-time-field','times':times,
            'fields':[asdict(x) for x in EPS_SUMMARY_FIELDS],
            'recordBytes':28*len(EPS_SUMMARY_FIELDS)*2,
        },
        'objects':inventory,
    }
    # Existing producer name removes punctuation rather than just a colon;
    # use exactly '2026-11-08T1800' (':00' removed).
    (folder / 'latest.json').write_text(json.dumps(meta)+'\n', encoding='utf8')
    core = core_report(folder)
    receipt = {
        'schema':'mid.ruc.prepared-core.v1',
        'producer':{'repository':'MeteoMartini/MID','sourceSha':SHA,
                    'eventSha':SHA,'runId':777,'runAttempt':1},
        'compatibilitySha256':'b'*64,
        'core':core,
    }
    (folder / 'prepared-core-proof.json').write_text(json.dumps(receipt)+'\n',encoding='utf8')
    return meta, receipt


class P3PostpackedCheck(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.meta, self.receipt = fixture(self.root)

    def test_sealed_native_units_and_postpacked_truth(self):
        result = assess(self.root, SHA, 777, 1, native=False, chunk_points=13)
        self.assertEqual((result['points'], result['chunks'], result['validTimes'],
                          result['members']), (37, 3, 28, 20))
        self.assertEqual(result['referenceComparedChunksOnly'], 3)
        self.assertGreater(result['postpackedMissingMemberCells'], 0)
        self.assertGreater(result['postpackedZeroMemberCells'], 0)
        self.assertIsNone(result['matchesOriginalPublishedSummaryBytes'])
        self.assertFalse(result['authenticOriginalGribFloatsPresent'])
        self.assertFalse(result['realOriginalGribBuilderSpeedupVerified'])
        self.assertFalse(result['publicationAuthorized'])
        self.assertFalse(result['sixtyMinuteProductionP95Authorized'])

    def test_false_native_geometry_never_accepted(self):
        with self.assertRaisesRegex(ValueError, '542040'):
            assess(self.root, SHA, 777, 1, native=True)

    def test_corrupted_original_packed_source_fails_core_sha(self):
        source = self.root/'eps-members.bin'
        data=bytearray(source.read_bytes());data[4] ^= 4;source.write_bytes(data)
        with self.assertRaisesRegex(ValueError, 'core object integrity'):
            assess(self.root, SHA, 777, 1, native=False)

    def test_source_attempt_run_digest_or_receipt_mismatch(self):
        for key, args in (('sha',('b'*40,777,1)),('run',(SHA,778,1)),
                          ('attempt',(SHA,777,2))):
            with self.subTest(key=key), self.assertRaisesRegex(ValueError,'producer'):
                assess(self.root, *args, native=False)
        receipt = json.loads((self.root/'prepared-core-proof.json').read_text())
        receipt['core']['objects'] += 1
        (self.root/'prepared-core-proof.json').write_text(json.dumps(receipt))
        with self.assertRaisesRegex(ValueError,'receipt'):
            assess(self.root, SHA, 777, 1, native=False)

    def test_metadata_key_traversal_and_unit_drift_are_rejected(self):
        for field, value in (('key','../../eps-members.bin'),('unit','kg/m²'),
                             ('nodata',0),('scale',1.0),('memberCount',19),
                             ('recordBytes',999)):
            with self.subTest(field=field):
                meta = json.loads((self.root/'latest.json').read_text())
                meta['eps'][field] = value
                (self.root/'latest.json').write_text(json.dumps(meta))
                # Keep hash proof in sync to show the semantic gate really works.
                receipt = json.loads((self.root/'prepared-core-proof.json').read_text())
                receipt['core'] = core_report(self.root)
                (self.root/'prepared-core-proof.json').write_text(json.dumps(receipt))
                with self.assertRaisesRegex(ValueError, 'EPS|key'):
                    verify_checkpoint(self.root, SHA, 777, 1, native=False)
                self.meta, self.receipt = fixture(self.root)

    def test_reject_unsafe_chunk_and_false_source_identity(self):
        for value in (0, 4097, 2.5, True):
            with self.subTest(chunk=value), self.assertRaises(ValueError):
                assess(self.root, SHA, 777, 1, native=False, chunk_points=value)
        with self.assertRaises(ValueError):
            verify_checkpoint(self.root, '../attacker', 777, 1, native=False)


if __name__=='__main__':
    unittest.main()
