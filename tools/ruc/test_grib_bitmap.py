"""Fail-closed DWD RUC GRIB bitmap / native grid / Kelvin decode regression fixtures."""
import unittest
from unittest.mock import patch
import numpy as np
from grib_bitmap import apply_native_bitmap,decode_bitmap_values
from meteo_integrity import MeteoIntegrityError,validate_core_fields
from build_ruc_bundle import normalize
from ruc_pack import FieldSpec,NODATA_I16,quantize,pack_cell_major


class DwdNativeBitmapTests(unittest.TestCase):
    def test_real_dwd_domain_size_and_missing_fraction(self):
        size=542040
        native=np.full(size,275.15,dtype=np.float32)
        native[-16968:]=9999.
        bitmap=np.ones(size,dtype=np.int8)
        bitmap[-16968:]=0
        decoded=apply_native_bitmap(native,1,bitmap,parameter='T_2M')
        self.assertEqual(decoded.size,size)
        self.assertEqual(int(np.count_nonzero(~np.isfinite(decoded))),16968)
        self.assertEqual(int(np.count_nonzero(np.isfinite(decoded))),525072)
        normalized=normalize('temperature_2m',decoded,'K')
        self.assertAlmostEqual(float(np.nanmin(normalized)),2.0,places=2)
        self.assertAlmostEqual(float(np.nanmax(normalized)),2.0,places=2)
        packed=quantize(normalized,FieldSpec('temperature_2m','°C',.01))
        self.assertEqual(int(packed[-1]),int(NODATA_I16))
        self.assertEqual(int(packed[0]),200)
        self.assertEqual(packed.size,size)
        # No regridding or shortened data vector: coordinate alignment is invariant.
        self.assertEqual(decoded.shape,native.shape)

    def test_valid_9999_is_not_silently_masked_without_bitmap(self):
        source=np.array([270.,9999.],dtype=np.float32)
        np.testing.assert_array_equal(apply_native_bitmap(source,0,None),source)
        converted=normalize('temperature_2m',source,'K')
        self.assertGreater(float(converted[1]),9000.)

    def test_invalid_bitmaps_fail_closed(self):
        vals=np.array([270.,9999.,274.],dtype=np.float32)
        for indicator,bits in [(1,None),(1,np.array([1,0])),(1,np.array([1,2,0])),
                               (254,None),(255,None),(0,np.array([1,1,1]))]:
            with self.subTest(indicator=indicator,bits=str(bits)), self.assertRaises(MeteoIntegrityError):
                apply_native_bitmap(vals,indicator,bits,parameter='T_2M')

    def test_eccodes_interface_uses_bitmap_not_value_guessing(self):
        native=np.array([274.,9999.,276.],dtype=np.float32)
        def codes_get_array(_gid,key):
            return {'values':native,'bitmap':np.array([1,0,1])}[key]
        with patch('eccodes.codes_get_long',return_value=1),patch('eccodes.codes_get_array',side_effect=codes_get_array):
            v=decode_bitmap_values(object())
        self.assertTrue(np.isnan(v[1]))
        self.assertAlmostEqual(float(v[2]),276.)

    def test_missing_mask_does_not_disable_temperature_gate(self):
        names=('temperature_2m','dew_point_2m','relative_humidity_2m','cloud_cover',
               'cloud_cover_low','wind_speed_10m','wind_gusts_10m',
               'wind_direction_10m','precipitation','cape')
        fields={name:np.zeros((2,3),dtype=np.float32) for name in names}
        fields['temperature_2m'][:]=[[-2.,2.,np.nan],[-1.,3.,np.nan]]
        fields['dew_point_2m'][:]=[[-3.,1.,np.nan],[-2.,2.,np.nan]]
        validate_core_fields(fields)
        fields['temperature_2m'][1,1]=100.
        with self.assertRaisesRegex(MeteoIntegrityError,'temperature_2m'):
            validate_core_fields(fields)

    def test_wire_nodata_marker_on_bitmasked_cells(self):
        temperature=apply_native_bitmap(np.array([274.15,9999.],dtype=np.float32),1,np.array([1,0]))
        packed=pack_cell_major({'temperature_2m':normalize('temperature_2m',temperature,'K')[None,:]},
                               (FieldSpec('temperature_2m','°C',.01),))
        ints=np.frombuffer(packed,dtype='<i2')
        self.assertEqual(int(ints[0]),100)
        self.assertEqual(int(ints[1]),-32768)


if __name__=='__main__':
    unittest.main()
