"""Offline fail-closed RUC native/normalized temperature provenance tests."""
import unittest
from datetime import datetime, timezone
from unittest.mock import patch
import numpy as np
from build_ruc_bundle import temperature_decode_audit, collect_parameter, normalize
from meteo_integrity import validate_core_fields, MeteoIntegrityError

class TemperatureDecodeAuditTests(unittest.TestCase):
    def test_kelvin_native_and_normalized(self):
        run=datetime(2026,10,9,0,tzinfo=timezone.utc)
        native=np.array([271.15,273.15,290.,np.nan],dtype=np.float32)
        rows=[]
        def records(*args,**kwargs):
            yield run,0,native,"K",{"centre":78}
        with patch("build_ruc_bundle.read_messages", records), patch("build_ruc_bundle.assert_same_parameter_signature",return_value={}):
            result=collect_parameter(["T_2M_20261009_00.grib2"],"temperature_2m",[run],4,rows)
        self.assertAlmostEqual(result[run][0],-2.,places=2)
        self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]["units"],"K")
        self.assertEqual(rows[0]["native"]["nonfinite"],1)
        self.assertAlmostEqual(rows[0]["normalized"]["min"],-2.,places=2)
        self.assertEqual(rows[0]["normalized"]["outsideC"],0)
        self.assertIn("T_2M",rows[0]["gribFile"])

    def test_invalid_native_values_remain_invalid(self):
        sentinel=np.array([279.,9999.,np.inf],dtype=np.float32)
        converted=normalize("temperature_2m",sentinel,"K")
        report=temperature_decode_audit(converted)
        self.assertEqual(report["outsideC"],1)
        self.assertEqual(report["nonfinite"],1)
        self.assertGreater(report["max"],66.85)
        self.assertEqual(temperature_decode_audit(np.array([np.nan,np.inf]))["min"],None)

    def test_no_unsafe_unit_reclassification_or_validator_bypass(self):
        native=np.array([2.,-30.],dtype=np.float32)
        np.testing.assert_allclose(normalize("temperature_2m",native,"C"),native)
        names=("temperature_2m","dew_point_2m","relative_humidity_2m","cloud_cover","cloud_cover_low","wind_speed_10m","wind_gusts_10m","wind_direction_10m","precipitation","cape")
        fields={k:np.array([[0.,0.]]) for k in names}
        fields["temperature_2m"]=np.array([[2.,100.]])
        with self.assertRaisesRegex(MeteoIntegrityError,"temperature_2m"):
            validate_core_fields(fields)

if __name__=="__main__":unittest.main()
