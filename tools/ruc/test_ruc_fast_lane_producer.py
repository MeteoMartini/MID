#!/usr/bin/env python3
"""Regression and adversarial tests for isolated deterministic short-horizon candidate."""
import copy
from datetime import datetime,timedelta,timezone
from hashlib import sha256
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch,Mock
from ruc_fast_lane_producer import (
    FIELDS, EXPECTED_LEADS, EXPECTED_RAPID5, EXPECTED_RAPID15,
    WIRE_FIELDS, WIRE_CONTRACT, canonical_run, lead_inventory, verify_candidate_manifest, safe_quantization, digest)

RUN='2026-10-31T10:00'
T=datetime(2026,10,31,10,tzinfo=timezone.utc)
fmt=lambda dt:dt.strftime('%Y-%m-%dT%H:%M')


def candidate(root):
    objs={}
    for name, length in (('deterministic.bin',2*7*12*2),
                         ('rapid-5m.bin',2*73*2),
                         ('rapid-15m.bin',2*25*3*2),('lookup.bin',2*1*4)):
        (root/name).write_bytes(bytes(length))
        objs[name]=digest(root/name)
    return {'schema':'mid.ruc.fast-prepared.v1','run':RUN,'horizonHours':6,
        'eps':{'availability':'unavailable'},'publicationAuthorized':False,
        'pointCount':2,'grid':{'nativePointCount':2,'nx':2,'ny':1},
        'realtimeConsumerEnabled':False,
        'fields':[{'name':name,'unit':unit,'scale':scale,'offset':offset}
                  for name,unit,scale,offset in WIRE_CONTRACT],
        'dataTimes':[fmt(T+timedelta(hours=i)) for i in range(7)],
        'rapid5Times':[fmt(T+timedelta(minutes=i)) for i in range(0,361,5)],
        'rapid15Times':[fmt(T+timedelta(minutes=i)) for i in range(0,361,15)],
        'objects':objs}


class TestFast(unittest.TestCase):
    def test_run_valid(self):self.assertEqual(canonical_run(RUN),RUN)
    def test_run_invalid_calendar(self):
        for x in ('2026-13-01T09:00','2026-10-31T09:30','2026-10-31T09:00Z','2026-02-30T09:00'):
            with self.subTest(run=x),self.assertRaises(ValueError):canonical_run(x)
    def test_whole_native_forecast_step_missing_rejected(self):
        import numpy as np
        from collections import namedtuple
        Spec=namedtuple('Spec','name offset scale')
        values=np.array([[0.,1.],[np.nan,np.nan],[2.,np.nan]])
        with self.assertRaisesRegex(ValueError,'forecast step entirely missing'):
            safe_quantization({'precipitation':values},(Spec('precipitation',0.,0.01),),np)
    def test_real_dry_zero_remains_finite(self):
        import numpy as np
        from collections import namedtuple
        Spec=namedtuple('Spec','name offset scale')
        values=np.array([[0.,np.nan],[0.,0.],[0.04,np.nan]])
        self.assertTrue(safe_quantization({'precipitation':values},(Spec('precipitation',0.,0.01),),np))
    def test_infinite_value_is_invalid_not_missing(self):
        import numpy as np
        from collections import namedtuple
        Spec=namedtuple('Spec','name offset scale')
        with self.assertRaisesRegex(ValueError,'infinity'):
            safe_quantization({'precipitation':np.array([[0.,np.inf]])},(Spec('precipitation',0.,0.01),),np)
    def test_extreme_cannot_clip_as_normal_data(self):
        import numpy as np
        from collections import namedtuple
        Spec=namedtuple('Spec','name offset scale')
        with self.assertRaisesRegex(ValueError,'native extreme'):
            safe_quantization({'precipitation':np.array([[40000.]])},(Spec('precipitation',0.,0.01),),np)
    def test_native_hourly_exact(self):self.assertEqual(lead_inventory(sorted(EXPECTED_LEADS),lambda x:int(x),EXPECTED_LEADS),7)
    def test_missing_native_hour(self):
        with self.assertRaises(ValueError):lead_inventory([0,60,120,180,240,300],lambda x:int(x),EXPECTED_LEADS)
    def test_duplicate_native_lead(self):
        with self.assertRaises(ValueError):lead_inventory([0,60,120,180,240,300,360,360],lambda x:int(x),EXPECTED_LEADS)
    def test_native_rapid_cadences(self):
        self.assertEqual(lead_inventory(sorted(EXPECTED_RAPID5),lambda x:int(x),EXPECTED_RAPID5),73)
        self.assertEqual(lead_inventory(sorted(EXPECTED_RAPID15),lambda x:int(x),EXPECTED_RAPID15),25)
    def test_valid_local_manifest_never_release(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            self.assertEqual(verify_candidate_manifest(c,root),{'verifiedLocalBytes':True,'publicationAuthorized':False})
    def test_invalid_native_grid_and_field_order(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['grid']['nativePointCount']=3
            with self.assertRaisesRegex(ValueError,'native grid'):verify_candidate_manifest(c,root)
            c=candidate(root);c['fields'][0]['name']='fake_temperature'
            with self.assertRaisesRegex(ValueError,'wire field'):verify_candidate_manifest(c,root)
    def test_rehashed_truncated_wire_object_still_fails(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            (root/'rapid-15m.bin').write_bytes(bytes(8))
            c['objects']['rapid-15m.bin']=digest(root/'rapid-15m.bin')
            with self.assertRaisesRegex(ValueError,'record length'):
                verify_candidate_manifest(c,root)
    def test_rehashed_extra_wire_object_still_fails(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            with (root/'deterministic.bin').open('ab') as file:file.write(b'\x00'*10)
            c['objects']['deterministic.bin']=digest(root/'deterministic.bin')
            with self.assertRaisesRegex(ValueError,'record length'):
                verify_candidate_manifest(c,root)
    def test_lookup_grid_dimensions_cannot_be_missing(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['grid'].pop('nx')
            with self.assertRaisesRegex(ValueError,'lookup grid'):
                verify_candidate_manifest(c,root)
    def test_rehashed_lookup_must_match_grid_size(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['grid']['ny']=2
            with self.assertRaisesRegex(ValueError,'record length'):
                verify_candidate_manifest(c,root)
    def test_rehashed_invalid_lookup_index_is_rejected(self):
        import struct
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            (root/'lookup.bin').write_bytes(struct.pack('<II',0,2))
            c['objects']['lookup.bin']=digest(root/'lookup.bin')
            with self.assertRaisesRegex(ValueError,'nonexistent native point'):
                verify_candidate_manifest(c,root)
    def test_rehashed_all_missing_lookup_is_not_empty_coverage(self):
        import struct
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            (root/'lookup.bin').write_bytes(struct.pack('<II',0xffffffff,0xffffffff))
            c['objects']['lookup.bin']=digest(root/'lookup.bin')
            with self.assertRaisesRegex(ValueError,'lookup coverage'):
                verify_candidate_manifest(c,root)
    def test_rehashed_partial_lookup_below_coverage_contract(self):
        import struct
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            (root/'lookup.bin').write_bytes(struct.pack('<II',0,0xffffffff))
            c['objects']['lookup.bin']=digest(root/'lookup.bin')
            with self.assertRaisesRegex(ValueError,'lookup coverage'):
                verify_candidate_manifest(c,root)
    def test_real_zero_lookup_index_is_valid(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            self.assertFalse(verify_candidate_manifest(c,root)['publicationAuthorized'])
    def test_mislabelled_units_fail_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            c['fields'][0]['unit']='K'
            with self.assertRaisesRegex(ValueError,'unit/scale/offset'):
                verify_candidate_manifest(c,root)
    def test_wrong_precipitation_scale_fails_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            c['fields'][7]['scale']=0.1
            with self.assertRaisesRegex(ValueError,'unit/scale/offset'):
                verify_candidate_manifest(c,root)
    def test_wrong_offset_fails_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            c['fields'][0]['offset']=273.15
            with self.assertRaisesRegex(ValueError,'unit/scale/offset'):
                verify_candidate_manifest(c,root)
    def test_consumer_activation_claim_fails_closed(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root)
            c['realtimeConsumerEnabled']=True
            with self.assertRaisesRegex(ValueError,'realtime consumers'):
                verify_candidate_manifest(c,root)
    def test_missing_field(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['objects'].pop('lookup.bin')
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_byte_tamper(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);(root/'lookup.bin').write_bytes(b'attack')
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_shifted_data_time(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['dataTimes'][3]='2026-10-31T13:30'
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_missing_rapid_time(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['rapid5Times'].pop()
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_partial_eps_forbidden(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['eps']={'availability':'complete','members':19}
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_invalid_release_claim(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);c['publicationAuthorized']=True
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)
    def test_local_symlink_fails(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);c=candidate(root);(root/'lookup.bin').unlink();(root/'lookup.bin').symlink_to('deterministic.bin')
            with self.assertRaises(ValueError):verify_candidate_manifest(c,root)

    def test_failed_directory_preflight_closes_http_session(self):
        """Before any GRIB is downloaded, reject bad listing and close session."""
        from ruc_fast_lane_producer import build
        http=Mock()
        with tempfile.TemporaryDirectory() as folder:
            base=Path(folder)
            with patch('fetch_and_build_ruc.session',return_value=http), \
                 patch('fetch_and_build_ruc.crawl_files',side_effect=OSError('DWD index unavailable')):
                with self.assertRaisesRegex(OSError,'DWD index unavailable'):
                    build(RUN,base/'candidate',base/'staging')
            http.close.assert_called_once_with()
            self.assertFalse((base/'candidate').exists())

if __name__=='__main__':unittest.main()
