#!/usr/bin/env python3
"""Offline pointer staging, budget, tamper and nonactivation checks."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from ruc_fast_pointer_staging import stage_fast_candidate, strict_budget, count_files


class Tests(unittest.TestCase):
    def test_budget_passes_with_headroom(self):
        self.assertEqual(strict_budget(470_000_000,254_000_000),176_000_000)
    def test_budget_exact_ceiling_blocked(self):
        with self.assertRaises(ValueError):strict_budget(650_000_000,250_000_000)
    def test_unknown_budget_rejected(self):
        for missing in (None,-1,True,0.4,'400000000'):
            with self.assertRaises(ValueError):strict_budget(missing,100)
    def test_forged_ceiling_rejected(self):
        with self.assertRaises(ValueError):strict_budget(1,1,1_000_000_000)
    def test_site_symlink_not_counted(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d);(p/'bytes').write_bytes(b'abc');(p/'alias').symlink_to('bytes')
            with self.assertRaises(ValueError):count_files(p)
    def test_staged_pointer_inactive_and_sha_inventory(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);source=base/'candidate';source.mkdir()
            data=b'GRIB'+b'x'*10
            objects={}
            for name in ('deterministic.bin','rapid-5m.bin','rapid-15m.bin','lookup.bin'):
                (source/name).write_bytes(data)
                objects[name]={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
            meta={'schema':'mid.ruc.fast-prepared.v1','run':'2026-10-31T15:00',
                  'pointCount':542040,'objects':objects,'dataTimes':['a'],
                  'rapid5Times':['b'],'rapid15Times':['c'],'sourceGrib':[],
                  'publicationAuthorized':False}
            (source/'fast-candidate.json').write_text(json.dumps(meta))
            with patch('ruc_fast_pointer_staging.verify_candidate_manifest',return_value={
                'verifiedLocalBytes':True,'publicationAuthorized':False}):
                result=stage_fast_candidate(source,base/'inactive')
            self.assertFalse(result['productionAuthorized'])
            pointer=json.loads((base/'inactive'/'ruc'/'fast'/'latest.json').read_text())
            self.assertFalse(pointer['productionEnabled'])
            self.assertFalse(pointer['realtimeConsumerEnabled'])
            self.assertFalse(pointer['consumerAdoptionVerified'])
            for name,obj in pointer['objects'].items():
                f=base/'inactive'/'ruc'/obj['key']
                self.assertTrue(f.exists())
                self.assertEqual(hashlib.sha256(f.read_bytes()).hexdigest(),obj['sha256'])
            with self.assertRaises(ValueError):
                with patch('ruc_fast_pointer_staging.verify_candidate_manifest',return_value={
                    'verifiedLocalBytes':True,'publicationAuthorized':False}):
                    stage_fast_candidate(source,base/'inactive')
    def test_failing_admission_leaves_no_pointer(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);(root/'candidate').mkdir()
            (root/'candidate'/'fast-candidate.json').write_text('{}')
            with self.assertRaises(ValueError):stage_fast_candidate(root/'candidate',root/'inactive')
            self.assertFalse((root/'inactive').exists())
    def test_missing_object_does_not_promote(self):
        with tempfile.TemporaryDirectory() as td:
            base=Path(td);(base/'candidate').mkdir()
            (base/'candidate'/'fast-candidate.json').write_text(json.dumps({
                'run':'2026-10-31T15:00','objects':{}}))
            with patch('ruc_fast_pointer_staging.verify_candidate_manifest',return_value={
                'verifiedLocalBytes':True,'publicationAuthorized':False}):
                with self.assertRaises(KeyError):stage_fast_candidate(base/'candidate',base/'inactive')
            self.assertFalse((base/'inactive').exists())

if __name__=='__main__':unittest.main()
