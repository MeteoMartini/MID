#!/usr/bin/env python3
"""Offline adversarial tests for bounded live GRIB canary."""
import hashlib
import tempfile
from pathlib import Path
import unittest
from unittest.mock import Mock
import numpy as np
from ruc_dwd_grib_live_canary import (bitmap_evidence, bounded_download,
                                      select_probe_files, select_run)

BASE='https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/T_2M/r/2026-10-31T11:00/s/'

def file(lead):
    return BASE+f'PT{lead//60:03}H{lead%60:02}M.grib2'


class Reply:
    status_code=200
    def __init__(self, blocks, headers=None):
        self.blocks=blocks;self.headers=headers or {}
    def __enter__(self):return self
    def __exit__(self,*a):return False
    def iter_content(self,_):return iter(self.blocks)

class CanaryTests(unittest.TestCase):
    def test_probe_native_leads(self):
        found=select_probe_files([file(60),file(0)],{0,60},lambda url: int(url.rsplit('PT',1)[1][0:3])*60)
        self.assertEqual(len(found),2)
    def test_missing_lead_not_admitted(self):
        with self.assertRaises(ValueError):select_probe_files([file(60)],{0,60},lambda _:60)
    def test_duplicate_lead_not_admitted(self):
        with self.assertRaises(ValueError):select_probe_files([file(0),file(0)],{0},lambda _:0)
    def test_untrusted_url_rejected(self):
        with self.assertRaises(ValueError):select_probe_files(['https://example.org/a.grib2'],{0},lambda _:0)
    def test_bitmap_missing_distinct_from_real_dry_zero(self):
        x=bitmap_evidence(np.array([0.,9999.,1.]),[1,0,1],3)
        self.assertEqual(x['validPoints'],2)
        self.assertEqual(x['missingPoints'],1)
        self.assertEqual(x['realZeroPoints'],1)
    def test_all_missing_is_invalid(self):
        with self.assertRaises(ValueError):bitmap_evidence([9999.,9999.],[0,0],2)
    def test_infinite_valid_cell_fatal(self):
        with self.assertRaises(ValueError):bitmap_evidence([float('inf')],[1],1)
    def test_infinite_missing_cell_not_fatal(self):
        self.assertEqual(bitmap_evidence([float('inf'),0.],[0,1],2)['validPoints'],1)
    def test_bitmap_length_fatal(self):
        with self.assertRaises(ValueError):bitmap_evidence([1.,2.],[1],2)
    def test_native_length_fatal(self):
        with self.assertRaises(ValueError):bitmap_evidence([1.,2.],[1,1],3)
    def test_download_rejects_cross_origin(self):
        sess=Mock()
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):bounded_download(sess,'https://example.org/file.grib2',Path(d)/'x')
        sess.get.assert_not_called()
    def test_download_rejects_redirect(self):
        sess=Mock();sess.get.return_value=Reply([],headers={});sess.get.return_value.status_code=302
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(RuntimeError):bounded_download(sess,file(0),Path(d)/'x')
    def test_download_rejects_short_partial(self):
        sess=Mock();sess.get.return_value=Reply([b'GRIB'+b'a'*100],headers={'Content-Length':'120'})
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):bounded_download(sess,file(0),Path(d)/'x')
    def test_download_rejects_declared_oversize(self):
        sess=Mock();sess.get.return_value=Reply([],headers={'Content-Length':'99999999'})
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):bounded_download(sess,file(0),Path(d)/'x',max_bytes=200)
    def test_download_rejects_streamed_oversize(self):
        sess=Mock();sess.get.return_value=Reply([b'GRIB'+b'a'*300],headers={})
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):bounded_download(sess,file(0),Path(d)/'x',max_bytes=200)
    def test_download_sha(self):
        sess=Mock();data=b'GRIB'+b'a'*130;sess.get.return_value=Reply([data],headers={'Content-Length':str(len(data))})
        with tempfile.TemporaryDirectory() as d:
            result=bounded_download(sess,file(0),Path(d)/'x')
            self.assertEqual(result,{'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
    def test_download_corrupt_magic_fatal(self):
        sess=Mock();sess.get.return_value=Reply([b'BAD!'+b'a'*130],headers={})
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):bounded_download(sess,file(0),Path(d)/'x')

if __name__ == '__main__':unittest.main()
