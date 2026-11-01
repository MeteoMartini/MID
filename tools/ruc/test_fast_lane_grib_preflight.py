#!/usr/bin/env python3
"""Read-only RUC fast-lane header negative tests; no DWD/network/publish."""
import tempfile
import unittest
from pathlib import Path
from datetime import timedelta

from fast_lane_grib_preflight import CORE_FIELDS, evaluate
from ruc_freshness_shadow_gate import model_time

RUN='2026-10-31T18:00'
PARAMETERS=dict.fromkeys(CORE_FIELDS,'temperature_2m')


def seed(root):
    for field in CORE_FIELDS:
        p=root/'deterministic'/field/'slot.grib2'
        p.parent.mkdir(parents=True,exist_ok=True)
        p.write_bytes(field.encode())
    for relative in ('eps/TOT_PREC','grid/CLAT','grid/CLON'):
        p=root/relative/'slot.grib2'
        p.parent.mkdir(parents=True,exist_ok=True)
        p.write_bytes(b'GRIB')


def reader(path,base,parameter,ensemble):
    if 'grid' in path.parts:
        return [(base,None,('native','grid'))]
    if ensemble:
        return [(base+timedelta(hours=h),m,('native','eps'))
                for h in range(7) for m in range(1,21)]
    return [(base+timedelta(hours=h),None,('native','det')) for h in range(7)]


class FastLaneTests(unittest.TestCase):
    def runcheck(self,mutate=None,hours=6):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);seed(root)
            return evaluate(root,RUN,hours,reader=mutate or reader,parameters=PARAMETERS)

    def test_header_pass_is_never_publish_authority(self):
        r=self.runcheck()
        self.assertTrue(r['deterministicHeadersComplete'])
        self.assertTrue(r['epsHeadersComplete'])
        self.assertTrue(r['gridHeadersComplete'])
        for claim in ('bitmapValuesVerified','losslessPackingVerified',
                      'workerPagesAppReadbackVerified','publicationAuthorized'):
            self.assertFalse(r[claim])
        self.assertEqual(len(r['sourceObjects']),15)
        self.assertTrue(all(len(o['sha256'])==64 for o in r['sourceObjects']))

    def test_14h_not_inferred_from_six(self):
        r=self.runcheck(hours=14)
        self.assertFalse(r['deterministicHeadersComplete'])
        self.assertFalse(r['epsHeadersComplete'])
        self.assertEqual(r['deterministic']['T_2M']['missingCount'],8)

    def test_missing_field_not_zero(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);seed(root)
            (root/'deterministic'/'PMSL'/'slot.grib2').unlink()
            r=evaluate(root,RUN,reader=reader,parameters=PARAMETERS)
            self.assertFalse(r['deterministicHeadersComplete'])
            self.assertEqual(r['deterministic']['PMSL']['missingCount'],7)

    def test_partial_eps_independent_from_deterministic(self):
        def partial(*args):
            rows=reader(*args)
            return [row for row in rows if not(args[-1] and row[1]==20)]
        r=self.runcheck(partial)
        self.assertTrue(r['deterministicHeadersComplete'])
        self.assertFalse(r['epsHeadersComplete'])
        self.assertEqual(r['epsMissingMemberIdsByValidUtc']['2026-10-31T18:00'],[20])

    def test_duplicate_member_and_hour_rejected(self):
        def duplicate(*args):
            rows=reader(*args)
            return rows+rows[:1]
        r=self.runcheck(duplicate)
        self.assertFalse(r['deterministicHeadersComplete'])
        self.assertFalse(r['epsHeadersComplete'])

    def test_invalid_eps_member_cannot_pass_even_with_twenty(self):
        def invalid(*args):
            rows=reader(*args)
            if args[-1]:
                return rows+[(args[1],0,('native','eps'))]
            return rows
        r=self.runcheck(invalid)
        self.assertFalse(r['epsHeadersComplete'])

    def test_mixed_initialization_not_accepted(self):
        def mixed(path,base,param,ensemble):
            if 'T_2M' in path.parts:
                return [(base-timedelta(hours=1),None,('native','det'))]
            return reader(path,base,param,ensemble)
        self.assertFalse(self.runcheck(mixed)['deterministicHeadersComplete'])

    def test_wrong_coordinate_valid_time_rejected(self):
        def wrong(path,base,param,ensemble):
            if 'CLAT' in path.parts:
                return [(base+timedelta(hours=1),None,('native','coord'))]
            return reader(path,base,param,ensemble)
        self.assertFalse(self.runcheck(wrong)['gridHeadersComplete'])

    def test_invalid_run_horizon_mapping_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);seed(root)
            for hours in (0,27,True):
                with self.assertRaises(ValueError):
                    evaluate(root,RUN,hours,reader=reader,parameters=PARAMETERS)
            with self.assertRaises(ValueError):
                evaluate(root,'2026-02-30T18:00',reader=reader,parameters=PARAMETERS)
            with self.assertRaises(ValueError):
                evaluate(root,RUN,reader=reader,parameters={'T_2M':'temperature_2m'})

    def test_symlink_outside_staging_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);seed(root)
            p=root/'deterministic'/'T_2M'/'slot.grib2'
            p.unlink()
            p.symlink_to(root/'grid'/'CLAT'/'slot.grib2')
            with self.assertRaises(ValueError):
                evaluate(root,RUN,reader=reader,parameters=PARAMETERS)


if __name__=='__main__':
    unittest.main()
