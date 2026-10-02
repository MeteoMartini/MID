"""Deterministic decoder, accumulation and immutable publication contracts."""
import bz2,gzip,hashlib,json,tempfile,unittest
from datetime import datetime,timezone
from pathlib import Path
import numpy as np
from build_observed_precipitation import decode_rw,sum_complete,sample_indices
from build_model_map_fields import theta_e,contours,read_field
from eccodes import codes_grib_new_from_samples,codes_set,codes_set_values,codes_get_message,codes_release
from prepare_ruc_pages import prepare

class MapProductsTest(unittest.TestCase):
    def test_native_relative_humidity_supersaturation_not_cloud_fraction(self):
        def grib(param,level_type,level,value):
            g=codes_grib_new_from_samples('regular_ll_sfc_grib2')
            try:
                for key,val in [('Ni',3),('Nj',3),('latitudeOfFirstGridPointInDegrees',55),('latitudeOfLastGridPointInDegrees',47),('longitudeOfFirstGridPointInDegrees',6),('longitudeOfLastGridPointInDegrees',14),('iDirectionIncrementInDegrees',4),('jDirectionIncrementInDegrees',4),('dataDate',20261002),('dataTime',900),('forecastTime',1),('typeOfLevel',level_type),('level',level),('paramId',param)]:codes_set(g,key,val)
                codes_set_values(g,np.full(9,value))
                return bz2.compress(codes_get_message(g))
            finally:codes_release(g)
        humidity=grib(157,'isobaricInhPa',850,100.2)
        _,_,values,_=read_field(humidity,'2026100209',1,'relhum')
        self.assertTrue(np.all(values>100));self.assertTrue(np.isfinite(theta_e(np.full((3,3),280),values)).all())
        with self.assertRaises(ValueError):read_field(grib(164,'surface',0,100.2),'2026100209',1,'clct')
        with self.assertRaises(ValueError):read_field(grib(157,'isobaricInhPa',850,9999),'2026100209',1,'relhum')
    def test_rw_flags_units_timestamp(self):
        values=np.zeros(900*900,dtype='<u2');values[:5]=[12,0x2000,0x4000,0x8000,0x1000|12]
        payload=bz2.compress(b'RW020250100001026BY1620019VS 3SW 2.13PR E-01INT 60GP 900x 900\x03'+values.tobytes())
        field=decode_rw(payload,datetime(2026,10,2,2,50,tzinfo=timezone.utc))
        self.assertAlmostEqual(field[0,0],1.2);self.assertTrue(np.isnan(field[0,1:4]).all());self.assertAlmostEqual(field[0,4],1.2)
        with self.assertRaises(ValueError):decode_rw(payload,datetime(2026,10,2,1,50,tzinfo=timezone.utc))
        with self.assertRaises(ValueError):decode_rw(bz2.compress(b'RW\x03'+b'\0'*4))
    def test_missing_not_dry(self):
        result=sum_complete([np.array([[0.,1.,np.nan]]),np.array([[0.,2.,3.]])]);self.assertEqual(result.tolist(),[[0,30,-1]])
        row,col,covered=sample_indices([51.],[10.]);self.assertTrue(covered[0,0]);self.assertTrue(0<=row[0,0]<900 and 0<=col[0,0]<900)
    def test_thetae_and_contours(self):
        dry=theta_e(np.array([280.]),np.array([10.]));wet=theta_e(np.array([280.]),np.array([90.]));self.assertGreater(wet[0],dry[0]);self.assertGreater(dry[0],280)
        field=np.tile(np.linspace(1000,1020,13),(13,1));result=contours(field,np.linspace(47,55.2,13),np.linspace(5.5,15.6,13));self.assertTrue(result);self.assertTrue(all(len(p)==2 for c in result for p in c['paths']))
    def test_optional_products_are_immutable_manifest_objects(self):
        with tempfile.TemporaryDirectory(prefix='mid141-publish-') as temp:
            source=Path(temp)/'source';source.mkdir();target=Path(temp)/'target'
            metadata={'schema':'mid.dwd.ruc.grid.v2','run':'2026-10-02T00:00:00Z','deterministic':{'recordBytes':2},'epsSummary':{'recordBytes':2},'lookup':{},'rapid':{}}
            (source/'latest.json').write_text(json.dumps(metadata))
            for name in ['deterministic.bin','eps-summary.bin','rapid-5m.bin','rapid-15m.bin']:(source/name).write_bytes(b'\0\0')
            (source/'lookup.bin').write_bytes(b'\0'*4);(source/'rapid-extreme.json').write_text('{}')
            (source/'observed-precipitation.json').write_text(json.dumps({'schema':'mid.radolan.observed.v1','kind':'observed','run':'2026-10-02T02:50:00Z'}))
            fields=source/'model-fields';fields.mkdir();file=fields/'temperature-001.bin';raw=b'{"values":[-100,0,100]}';file.write_bytes(gzip.compress(raw,mtime=0));self.assertEqual(gzip.decompress(file.read_bytes()),raw)
            index={'schema':'mid.icon-d2.fields.v1','run':'2026-10-02T00:00:00Z','products':{'temperature':{'frames':[{'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'bytes':file.stat().st_size}]}}}
            (fields/'index.json').write_text(json.dumps(index));result=prepare(source,target)
            self.assertIn('__fields_',result['modelFields']['key']);self.assertIn('__observed_',result['observedPrecipitation']['key'])
            for obj in result['pages']['objects']:
                data=(target/'ruc'/obj['key']).read_bytes();self.assertEqual(len(data),obj['bytes']);self.assertEqual(hashlib.sha256(data).hexdigest(),obj['sha256'])
            index['products']['temperature']['frames'][0]['sha256']='0'*64;(fields/'index.json').write_text(json.dumps(index))
            with self.assertRaises(ValueError):prepare(source,target)

if __name__=='__main__':unittest.main()
