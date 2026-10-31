#!/usr/bin/env python3
"""Offline adversarial checks for bounded real DWD GRIB shadow sampler."""
import bz2
from datetime import timedelta
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import real_grib_first_field_shadow as s
from ruc_freshness_shadow_gate import model_time

RUN='2026-10-31T19:00'
ROOT=f'{s.DET}T_2M/r/{RUN}/'
URL=ROOT+'T_2M_PT000H00M.grib2.bz2'
BASE=model_time(RUN)


class FakeResponse:
    def __init__(self,data,url=URL,status=200,headers=None):
        self.buffer=io.BytesIO(data)
        self.url=url
        self.status=status
        self.headers=headers or {}
    def __enter__(self): return self
    def __exit__(self,*args): return False
    def geturl(self): return self.url
    def read(self,n): return self.buffer.read(n)


class Tests(unittest.TestCase):
    def test_single_actual_advertisement_is_required(self):
        self.assertEqual(s.choose_source(RUN,indexer=lambda url:[URL]),URL)
        with self.assertRaises(ValueError):
            s.choose_source(RUN,indexer=lambda url:[])
        with self.assertRaises(ValueError):
            s.choose_source(RUN,indexer=lambda url:[URL,ROOT+'alternative_PT000H00M.grib2.bz2'])
        with self.assertRaises(ValueError):
            s.choose_source(RUN,lead_minutes=15,indexer=lambda url:[URL])

    def test_exfiltration_redirect_not_allowed(self):
        with tempfile.TemporaryDirectory() as folder:
            with self.assertRaises(RuntimeError):
                s.fetch_bounded(URL,Path(folder)/'out',fetcher=lambda req,timeout:FakeResponse(
                    b'A'*140,url='https://example.org/file.grib2.bz2'))
        def poison(_url):return ['//attacker.example/field_PT000H00M.grib2']
        self.assertRaises(ValueError,s.choose_source,RUN,indexer=poison)

    def test_bounded_verified_wire_sha(self):
        data=b'GRIB'+b'A'*154
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/'source.grib2.bz2'
            r=s.fetch_bounded(URL,target,fetcher=lambda req,timeout:FakeResponse(data))
            self.assertEqual(r['bytes'],158)
            self.assertEqual(target.read_bytes(),data)
            self.assertEqual(len(r['sha256']),64)
            self.assertRaises(FileExistsError,s.fetch_bounded,URL,target,
                              fetcher=lambda req,timeout:FakeResponse(data))

    def test_wire_cap_and_untrusted_length(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(s,'MAX_WIRE_BYTES',140):
                self.assertRaises(ValueError,s.fetch_bounded,URL,Path(folder)/'big',
                                  fetcher=lambda req,timeout:FakeResponse(b'G'*150))
            self.assertRaises(ValueError,s.fetch_bounded,URL,Path(folder)/'short',
                              fetcher=lambda req,timeout:FakeResponse(b'GRIB'))
            self.assertRaises(ValueError,s.fetch_bounded,URL,Path(folder)/'length',
                              fetcher=lambda req,timeout:FakeResponse(b'A'*150,
                                   headers={'Content-Length':str(s.MAX_WIRE_BYTES+1)}))

    def test_bzip2_expansion_budget(self):
        with tempfile.TemporaryDirectory() as folder:
            source=Path(folder)/'raw.bz2'
            source.write_bytes(bz2.compress(b'GRIB'+b'X'*145))
            target=Path(folder)/'decompressed.grib2'
            self.assertEqual(s.decompress_bounded(source,target),149)
            with patch.object(s,'MAX_DECODED_BYTES',100):
                self.assertRaises(ValueError,s.decompress_bounded,source,Path(folder)/'too-large')

    def test_valid_real_value_metadata_still_never_authorizes(self):
        actual=s.validate_witness([(BASE,0,542040,500000,-24.5,31.2,'degC')],
                                  run=RUN,lead_minutes=0,point_count=542040)
        self.assertEqual(actual['missingPointCount'],42040)
        self.assertEqual(actual['finitePointCount'],500000)

    def test_unknown_not_zero_and_synthetic_run_rejected(self):
        invalid = [
            (BASE,0,542040,0,float('nan'),float('nan'),'degC'),
            (BASE,0,542040,542041,-10,20,'degC'),
            (BASE,1,542040,500000,-10,20,'degC'),
            (BASE+timedelta(hours=1),0,542040,500000,-10,20,'degC'),
            (BASE,0,542040,500000,250,300,'degC'),
            (BASE,0,542040,500000,-10,20,'K'),
        ]
        for record in invalid:
            with self.subTest(record=record):
                self.assertRaises(ValueError,s.validate_witness,[record],
                                  run=RUN,lead_minutes=0,point_count=542040)
        self.assertRaises(ValueError,s.validate_witness,[],run=RUN,lead_minutes=0,point_count=542040)
        self.assertRaises(ValueError,s.validate_witness,[invalid[-1]]*2,
                          run=RUN,lead_minutes=0,point_count=542040)


if __name__=='__main__':
    unittest.main()
