"""GRIB2 origin/signature offline negative fixtures for MID audit phase 2b."""
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import numpy as np
from eccodes import codes_grib_new_from_samples, codes_set, codes_set_values, codes_get_message, codes_release
from grib_metadata import inspect_grib_header, assert_same_parameter_signature, CORE_CONTRACTS, NATIVE_GRID, validate_time_window, step_seconds, source_contract_manifest
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


def native_fixture(name,lead=1):
    """Real ecCodes GRIB message with calibrated raw headers and constant data."""
    gid=codes_grib_new_from_samples('regular_ll_sfc_grib2')
    contract=CORE_CONTRACTS[name]
    keys={'centre':78,'gridDefinitionTemplateNumber':101,
          'numberOfDataPoints':NATIVE_GRID[-1],'numberOfGridUsed':47,
          'numberOfGridInReference':1,'uuidOfHGrid':NATIVE_GRID[0],
          'dataDate':20261010,'dataTime':600,'discipline':contract[0],
          'parameterCategory':contract[1],'parameterNumber':contract[2],
          'typeOfFirstFixedSurface':contract[3],'scaleFactorOfFirstFixedSurface':0,
          'scaledValueOfFirstFixedSurface':contract[4],
          'typeOfSecondFixedSurface':contract[5],'stepType':contract[7]}
    for key,value in keys.items():codes_set(gid,key,value)
    if contract[5]!=255:
        codes_set(gid,'scaleFactorOfSecondFixedSurface',0)
        codes_set(gid,'scaledValueOfSecondFixedSurface',contract[6])
    codes_set(gid,'startStep',0 if contract[7]=='accum' else max(0,lead-1) if contract[7]=='max' else lead)
    codes_set(gid,'endStep',lead)
    codes_set_values(gid,np.zeros(NATIVE_GRID[-1]))
    return gid


class DwdGribMetadataTests(unittest.TestCase):
    def test_member_missing_on_entire_axis_is_not_erased_from_expectation(self):
        from datetime import timedelta
        run=datetime(2026,10,10,6,tzinfo=timezone.utc)
        times=[run,run+timedelta(hours=1)]
        signature=(0,1,52,'surface',0.,'regular_ll',2)
        messages=[(time,1,np.zeros(2),'mm',signature) for time in times]
        with patch.dict('os.environ',{'MID_RUC_EPS_DECODE_WORKERS':'1'}), \
             patch.object(builder,'decode_file_batch',return_value=messages):
            with self.assertRaisesRegex(MeteoIntegrityError,'required member set'):
                builder.collect_eps(['fixture'],times,2,expected_members=[1,2])

    def test_probe_axes_are_complete_unique_and_bounded(self):
        from scientific_grib_contract_probe import targets
        rows=targets('2026-10-10T06:00')
        self.assertEqual(len(rows),584)
        self.assertEqual(len({row['url'] for row in rows}),584)
        eps=[row for row in rows if row['member'] is not None]
        self.assertEqual(len(eps),20*15)
        self.assertEqual({row['member'] for row in eps},set(range(1,21)))
        for member in range(1,21):
            self.assertTrue(any(f'/e/{member:02d}/s/PT014H00M.grib2' in row['url'] for row in eps))
        for param,count in [('TOT_PREC',81),('CAPE_ML',33),('CIN_ML',33)]:
            self.assertEqual(len([row for row in rows if row['parameter']==param and row['member'] is None]),count)

    def test_source_contract_is_persisted_without_changing_wire_layout(self):
        import json
        from ruc_pack import write_meta,DEFAULT_FIELDS
        with tempfile.TemporaryDirectory() as tmp:
            path=Path(tmp)/'latest.json'
            manifest=source_contract_manifest('2026-10-10T06:00')
            self.assertEqual(manifest['forecastReferenceTime'],'2026-10-10T06:00:00+00:00')
            arguments=dict(run='2026-10-10T06:00',times=['2026-10-10T06:00'],
                           point_count=542040,specs=DEFAULT_FIELDS,grid={},
                           deterministic_key='det.bin',eps_key='eps.bin',lookup_key='lookup.bin')
            write_meta(path,**arguments)
            before=json.loads(path.read_text())
            write_meta(path,**arguments,source_grib_contract=manifest)
            after=json.loads(path.read_text())
            self.assertEqual(after.pop('sourceGribContract'),manifest)
            before.pop('generatedAt');after.pop('generatedAt')
            self.assertEqual(before,after)
            self.assertEqual(set(CORE_CONTRACTS),set(builder.PARAM_MAP.values())|{'CLAT','CLON'})

    def test_calibrated_core_and_coordinate_matrix_in_real_grib(self):
        for name in CORE_CONTRACTS:
            for lead in (0,1,2,14):
                gid=native_fixture(name,lead)
                try:
                    valid,signature=inspect_grib_header(gid,expected_parameter=name)
                    self.assertEqual(valid.hour,6+lead)
                    self.assertEqual(signature[-3],NATIVE_GRID)
                finally:codes_release(gid)

    def test_wrong_parameter_level_processing_and_same_size_grid_fail(self):
        gid=codes_grib_new_from_samples('regular_ll_sfc_grib2')
        try:
            codes_set(gid,'centre',78)
            with self.assertRaisesRegex(MeteoIntegrityError,'native unstructured'):
                inspect_grib_header(gid,expected_parameter='visibility')
        finally:codes_release(gid)
        mutations={'parameterNumber':6,'scaledValueOfFirstFixedSurface':10,
                   'typeOfFirstFixedSurface':1,'typeOfSecondFixedSurface':1,
                   'stepType':'avg','uuidOfHGrid':'00000000000000000000000000000001',
                   'numberOfGridUsed':48,'numberOfGridInReference':2}
        for key,value in mutations.items():
            gid=native_fixture('temperature_2m')
            try:
                codes_set(gid,key,value)
                with self.subTest(key=key),self.assertRaises(MeteoIntegrityError):
                    inspect_grib_header(gid,expected_parameter='temperature_2m')
            finally:codes_release(gid)
        for name,key,value in [('cloud_cover_low','scaledValueOfFirstFixedSurface',70000),
                               ('cape','typeOfFirstFixedSurface',103)]:
            gid=native_fixture(name)
            try:
                codes_set(gid,key,value)
                with self.assertRaisesRegex(MeteoIntegrityError,'parameter/level'):
                    inspect_grib_header(gid,expected_parameter=name)
            finally:codes_release(gid)

    def test_core_reader_does_not_trust_filename_or_count(self):
        gid=native_fixture('temperature_2m')
        try:
            with tempfile.TemporaryDirectory() as tmp:
                path=Path(tmp)/'TOT_PREC.grib2'
                path.write_bytes(codes_get_message(gid))
                with self.assertRaisesRegex(MeteoIntegrityError,'parameter/level'):
                    list(builder.read_messages(path,expected_parameter='precipitation_acc'))
                with self.assertRaisesRegex(MeteoIntegrityError,'parameter/level'):
                    builder.decode_file_batch((str(path),True,None))
        finally:codes_release(gid)

    def test_explicit_utc_lead_and_accumulation_bounds(self):
        run=datetime(2026,10,25,0,tzinfo=timezone.utc) # European DST fallback day
        from datetime import timedelta
        for seconds,value,unit in [(900,'15m',0),(4500,'75m',0),(3600,1,1),(900,'900s',13)]:
            valid=run+timedelta(seconds=seconds)
            result=validate_time_window(run,valid,0,value,unit,'accum')
            self.assertEqual(result['lead_seconds'],seconds)
            self.assertEqual(result['time_bounds'],[run.isoformat(),valid.isoformat()])
            validate_time_window(run,valid,value,value,unit,'instant')
        for start,end,unit,kind,hours in [(1,2,1,'accum',2),(0,2,1,'max',2),(0,1,1,'instant',1),(2,1,1,'max',1)]:
            with self.assertRaises(MeteoIntegrityError):
                validate_time_window(run,run+timedelta(hours=hours),start,end,unit,kind)
        from zoneinfo import ZoneInfo
        local=ZoneInfo('Europe/Berlin')
        reference=datetime(2026,10,25,2,tzinfo=local,fold=0)
        valid=datetime(2026,10,25,2,tzinfo=local,fold=1)
        self.assertEqual(validate_time_window(reference,valid,0,1,1,'accum')['lead_seconds'],3600)
        with self.assertRaises(MeteoIntegrityError):
            validate_time_window(run.replace(tzinfo=None),run,0,0,1,'instant')
        for value,unit in [('15m',1),('1h',0),('nan',1),('-1',1),('0.001',13),(1,255)]:
            with self.assertRaises(MeteoIntegrityError):step_seconds(value,unit)

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
                self.assertEqual([call.kwargs for call in read.call_args_list],
                                 [{'include_units':True,'expected_parameter':name} for name in ['CLAT','CLON']])
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
