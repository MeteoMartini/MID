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
    def test_declared_coordinate_units_not_magnitude(self):
        small=np.array([0.,1.,np.nan])
        for name,unit in [('CLAT','Degree N'),('CLON','Degree E')]:
            np.testing.assert_equal(builder.normalize_coordinate(name,small,unit),small)
            np.testing.assert_allclose(builder.normalize_coordinate(name,small,'radians'),np.degrees(small))
            np.testing.assert_equal(small,np.array([0.,1.,np.nan]))
        for name,unit in [('CLAT','Degree E'),('CLON','Degree N'),('CLAT',''),('CLON','m')]:
            with self.assertRaisesRegex(MeteoIntegrityError,'coordinate unit'):
                builder.normalize_coordinate(name,small,unit)

    def test_remaining_core_units_fail_closed(self):
        fields={'u10':'m s**-1','v10':'m/s','wind_gusts_10m':'m s-1',
                'cape':'J kg-1','convective_inhibition':'J kg**-1',
                'precipitation_acc':'kg m**-2'}
        values=np.array([0.,1.,np.nan])
        for name,unit in fields.items():
            np.testing.assert_equal(builder.normalize(name,values,unit),values)
            for bad in ['', 'unknown', 'knots', 'W m**-2']:
                with self.assertRaisesRegex(MeteoIntegrityError,'unsupported'):
                    builder.normalize(name,values,bad)
        np.testing.assert_equal(builder.normalize('precipitation_acc',values,'mm'),values)
        np.testing.assert_equal(builder.normalize('convective_inhibition',np.array([-1.]),'J kg-1'),[1.])

    def test_native_grid_uses_each_declared_axis_unit(self):
        with tempfile.TemporaryDirectory() as tmp:
            staging=Path(tmp)
            for name in ['CLAT','CLON']:
                folder=staging/'grid'/name
                folder.mkdir(parents=True)
                (folder/'fixture.grib2').touch()
            with patch.object(builder,'read_first_values',side_effect=[
                    (np.array([1.,2.]),'Degree N'),
                    (np.radians(np.array([3.,4.])),'rad')]) as read:
                lat,lon=builder.load_native_grid(staging,2)
                np.testing.assert_allclose(lat,[1.,2.])
                np.testing.assert_allclose(lon,[3.,4.])
                self.assertTrue(all(call.kwargs=={'include_units':True} for call in read.call_args_list))
            with patch.object(builder,'read_first_values',return_value=(np.array([91.,92.]),'Degree N')):
                with self.assertRaisesRegex(MeteoIntegrityError,'coordinate unit'):
                    builder.load_native_grid(staging,2)

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
            values,units=builder.read_first_values(path,include_units=True)
            np.testing.assert_equal(values,rows[0][2])
            self.assertEqual(units,rows[0][3])

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
