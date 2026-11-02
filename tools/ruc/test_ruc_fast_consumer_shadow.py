#!/usr/bin/env python3
"""Adversarial fast native consumer shadow: producer-independent binary readback."""
from __future__ import annotations
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

import numpy as np

sys.path.insert(0,str(Path(__file__).parent))
from ruc_fast_consumer_shadow import decode_cell,validate_pointer,inspect_shadow,axis
from ruc_fast_lane_producer import WIRE_CONTRACT
from ruc_fast_pointer_staging import SCHEMA
from ruc_fast_lane_producer import digest

RUN='2026-11-02T05:00'
NATIVE=4
LENGTHS={'deterministic.bin':NATIVE*7*12*2,'rapid-5m.bin':NATIVE*73*2,
         'rapid-15m.bin':NATIVE*25*3*2,'lookup.bin':4*4}


def setup_site(root):
    fast=root/'ruc'/'fast'
    d=fast/'runs'/'20261102T0500'
    d.mkdir(parents=True)
    for key,length in LENGTHS.items():
        if key=='lookup.bin':
            buf=np.arange(4,dtype='<u4').tobytes()
        else:
            arr=np.zeros(length//2,dtype='<i2')
            arr[0]=np.int16(-32768)
            arr[1]=np.int16(221)
            buf=arr.tobytes()
        (d/key).write_bytes(buf)
    pointer={
        'schema':SCHEMA,'sourceSchema':'mid.ruc.fast-prepared.v1',
        'run':RUN,'horizonHours':6,'eps':{'availability':'unavailable'},
        'nativePoints':NATIVE,'grid':{'nativePointCount':NATIVE,'nx':2,'ny':2},
        'fields':[{'name':x[0],'unit':x[1],'scale':x[2],'offset':x[3]} for x in WIRE_CONTRACT],
        'dataTimes':axis(RUN,range(0,361,60)),
        'rapid5Times':axis(RUN,range(0,361,5)),
        'rapid15Times':axis(RUN,range(0,361,15)),
        'sourceGribSha256':'b'*64,'sourceRunManifestSha256':'a'*64,
        'objects':{name:{'key':'fast/runs/20261102T0500/'+name,**digest(d/name)}
                   for name in LENGTHS},
        'productionEnabled':False,'publicationAuthorized':False,
        'realtimeConsumerEnabled':False,'consumerAdoptionVerified':False,
    }
    envelope={**pointer,'pointerActivation':'inactive-only'}
    (d/'manifest.json').write_text(json.dumps(envelope),encoding='utf-8')
    pointer['envelope']={'key':'fast/runs/20261102T0500/manifest.json',**digest(d/'manifest.json')}
    (fast/'latest.json').write_text(json.dumps(pointer),encoding='utf-8')
    return pointer, d


class FastNativeShadowConsumer(unittest.TestCase):
    def test_original_missing_vs_authentic_zero_and_finite_extreme(self):
        self.assertIsNone(decode_cell(-32768,spec=WIRE_CONTRACT[0]))
        self.assertEqual(decode_cell(0,spec=WIRE_CONTRACT[0]),0)
        self.assertEqual(decode_cell(221,spec=WIRE_CONTRACT[0]),2.21)
        self.assertEqual(decode_cell(32767,spec=WIRE_CONTRACT[0]),327.67)
        for invalid in (-32769,32768,None,True,0.1):
            with self.subTest(invalid=invalid),self.assertRaises(ValueError):
                decode_cell(invalid,spec=WIRE_CONTRACT[0])

    def test_complete_separate_native_binary_real_byte_readback(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            pointer,files=setup_site(root)
            with patch('ruc_fast_consumer_shadow.NATIVE_POINTS',NATIVE):
                report=inspect_shadow(root)
            self.assertTrue(report['originalNativeObjectsVerified'])
            self.assertTrue(report['trueNoDataPreserved'])
            self.assertEqual(report['missingCells'],3)
            self.assertGreater(report['trueZeroCells'],1)
            self.assertEqual(report['objects']['lookup.bin']['validNativeReferences'],4)
            for flag in ('productionEnabled','publicationAuthorized',
                         'realtimeConsumerEnabled','consumerAdoptionVerified'):
                self.assertIs(report[flag],False)

    def test_tamper_one_binary_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            _,files=setup_site(root)
            (files/'rapid-5m.bin').write_bytes(b'bad')
            with patch('ruc_fast_consumer_shadow.NATIVE_POINTS',NATIVE),self.assertRaises(ValueError):
                inspect_shadow(root)

    def test_same_hash_replaced_envelope_activation_fails(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            pointer,files=setup_site(root)
            env=json.loads((files/'manifest.json').read_text())
            env['pointerActivation']='production-activated'
            (files/'manifest.json').write_text(json.dumps(env))
            pointer['envelope']= {'key':pointer['envelope']['key'],**digest(files/'manifest.json')}
            (root/'ruc'/'fast'/'latest.json').write_text(json.dumps(pointer))
            with patch('ruc_fast_consumer_shadow.NATIVE_POINTS',NATIVE),self.assertRaisesRegex(ValueError,'live production'):
                inspect_shadow(root)

    def test_false_claim_of_eps20_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            pointer,_=setup_site(root)
            pointer['eps']={'availability':'complete','members':20}
            with patch('ruc_fast_consumer_shadow.NATIVE_POINTS',NATIVE),self.assertRaises(ValueError):
                validate_pointer(pointer)

    def test_premature_consumer_or_publication_activation_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            pointer,_=setup_site(Path(d))
            for flag in ('productionEnabled','publicationAuthorized',
                         'realtimeConsumerEnabled','consumerAdoptionVerified'):
                hostile=copy.deepcopy(pointer)
                hostile[flag]=True
                with self.subTest(flag=flag),patch('ruc_fast_consumer_shadow.NATIVE_POINTS',NATIVE),self.assertRaises(ValueError):
                    validate_pointer(hostile)

    def test_shifted_hour_or_rapid_validity_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            pointer,_=setup_site(Path(d))
            for axis_field in ('dataTimes','rapid5Times','rapid15Times'):
                hostile=copy.deepcopy(pointer)
                hostile[axis_field][1]='2026-11-02T05:59'
                with self.subTest(axis_field=axis_field),patch('ruc_fast_consumer_shadow.NATIVE_POINTS',NATIVE),self.assertRaises(ValueError):
                    validate_pointer(hostile)

    def test_schema_field_unit_grid_and_native_path_tamper_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            pointer,_=setup_site(Path(d))
            for key,value in [('sourceSchema','made-up'),('horizonHours',27),('nativePoints',0)]:
                hostile=copy.deepcopy(pointer)
                hostile[key]=value
                with self.subTest(key=key),patch('ruc_fast_consumer_shadow.NATIVE_POINTS',NATIVE),self.assertRaises(ValueError):
                    validate_pointer(hostile)
            hostile=copy.deepcopy(pointer)
            hostile['fields'][0]['unit']='K'
            with patch('ruc_fast_consumer_shadow.NATIVE_POINTS',NATIVE),self.assertRaisesRegex(ValueError,'units'):
                validate_pointer(hostile)
            hostile=copy.deepcopy(pointer)
            hostile['objects']['lookup.bin']['key']='../../stolen'
            with patch('ruc_fast_consumer_shadow.NATIVE_POINTS',NATIVE),self.assertRaises(ValueError):
                validate_pointer(hostile)

    def test_no_global_budget_bypass(self):
        with tempfile.TemporaryDirectory() as d:
            pointer,_=setup_site(Path(d))
            pointer['objects']['deterministic.bin']['bytes']=900000000
            with patch('ruc_fast_consumer_shadow.NATIVE_POINTS',NATIVE),self.assertRaises(ValueError):
                validate_pointer(pointer)


if __name__=='__main__':
    unittest.main()
