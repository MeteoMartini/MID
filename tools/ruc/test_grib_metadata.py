"""GRIB2 origin/signature offline negative fixtures for MID audit phase 2b."""
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import numpy as np
from eccodes import codes_grib_new_from_samples, codes_set, codes_get_message, codes_release
from grib_metadata import inspect_grib_header, assert_same_parameter_signature
from meteo_integrity import MeteoIntegrityError
import build_ruc_bundle as builder
import fetch_and_build_ruc as fetch


def fixture(*,centre=78,run_hour=18,step=0):
    gid=codes_grib_new_from_samples('regular_ll_sfc_grib2')
    try:
        codes_set(gid,'centre',centre)
        codes_set(gid,'dataDate',20261008)
        codes_set(gid,'dataTime',run_hour*100)
        codes_set(gid,'step',step)
        return codes_get_message(gid)
    finally:
        codes_release(gid)


class DwdGribMetadataTests(unittest.TestCase):
    def test_official_centre_and_run(self):
        run=datetime(2026,10,8,18,tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'valid.grib2'
            path.write_bytes(fixture(step=1))
            self.assertEqual(next(fetch.grib_valid_times(path,expected_run=run)).hour,19)
            rows=list(builder.read_messages(path,expected_run=run,include_signature=True))
            self.assertEqual(len(rows),1)
            self.assertEqual(rows[0][0].hour,19)
            self.assertEqual(rows[0][4][-1],len(rows[0][2]))

    def test_rejects_foreign_centre_and_wrong_run(self):
        run=datetime(2026,10,8,18,tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'foreign.grib2'
            path.write_bytes(fixture(centre=98))
            with self.assertRaisesRegex(MeteoIntegrityError,'originating centre'):
                list(fetch.grib_valid_times(path,expected_run=run))
            path.write_bytes(fixture(run_hour=12))
            with self.assertRaisesRegex(MeteoIntegrityError,'initialization'):
                list(builder.read_messages(path,expected_run=run))

    def test_signature_mismatch_fails(self):
        reference=(0,0,0,'surface',0.0,'regular_ll',100)
        assert_same_parameter_signature('temperature_2m',reference,reference)
        for changed in [(1,*reference[1:]),(*reference[:3],'heightAboveGround',*reference[4:]),(*reference[:-1],90)]:
            with self.assertRaisesRegex(MeteoIntegrityError,'differs'):
                assert_same_parameter_signature('temperature_2m',reference,changed)

    def test_mixed_field_cannot_enter_core(self):
        run=datetime(2026,10,8,18,tzinfo=timezone.utc)
        sig=(0,0,0,'surface',0.0,'regular_ll',2)
        data=[(run,0,np.array([270.,271.]),'K',sig)]
        foreign=[(run,0,np.array([270.,271.]),'K',(0,0,1,*sig[3:]))]
        with patch.object(builder,'read_messages',side_effect=[iter(data),iter(foreign)]):
            with self.assertRaisesRegex(MeteoIntegrityError,'differs'):
                builder.collect_parameter([Path('one'),Path('two')],'temperature_2m',[run],2)

    def test_duplicate_rapid_time_is_not_silently_replaced(self):
        run=datetime(2026,10,8,18,tzinfo=timezone.utc)
        sig=(0,0,0,'surface',0.0,'regular_ll',2)
        record=(run,0,np.array([.1,.2]),'kg m**-2',sig)
        with patch.object(builder,'read_messages',side_effect=[iter([record]),iter([record])]):
            with self.assertRaisesRegex(SystemExit,'duplicate optional'):
                builder.collect_optional_parameter([Path('a'),Path('b')],'rain_acc',[run],2)


if __name__=='__main__':
    unittest.main()
