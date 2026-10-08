import unittest,tempfile,json,sys,gzip
from pathlib import Path
from datetime import datetime,timezone
import numpy as np
from eccodes import codes_grib_new_from_samples,codes_set,codes_set_values,codes_get_message,codes_release
from build_synoptic_fields import decode,contours,write_fields,COMPONENTS,theta_e
class SynopticTest(unittest.TestCase):
    def test_independent_metpy_references(self):
        # Bolton saturation differs from MetPy Ambaum saturation by <0.3 K here.
        # MetPy 1.7.1 equivalent_potential_temperature(850hPa,T,dewpoint_from_relative_humidity(T,RH)).
        for t,rh,expected in [(-20,20,265.754148625),(0,50,292.797881289),(15,80,332.034761543),(25,95,383.110977241)]:self.assertAlmostEqual(float(theta_e(np.array(t+273.15),np.array(rh))),expected,delta=.3)
    def test_actual_grib_identity(self):
        g=codes_grib_new_from_samples('regular_ll_pl_grib2')
        try:
            for k,v in {'Ni':12,'Nj':12,'latitudeOfFirstGridPointInDegrees':52.5,'latitudeOfLastGridPointInDegrees':47,'longitudeOfFirstGridPointInDegrees':6,'longitudeOfLastGridPointInDegrees':11.5,'iDirectionIncrementInDegrees':.5,'jDirectionIncrementInDegrees':.5,'dataDate':20261007,'dataTime':1200,'typeOfLevel':'isobaricInhPa','level':850,'shortName':'t','stepUnits':1,'forecastTime':3}.items():codes_set(g,k,v)
            codes_set_values(g,np.full(144,288.15));data=codes_get_message(g)
        finally:codes_release(g)
        lat,lon,v=decode(data,'2026100712',3,'t',850);self.assertEqual(v.shape,(12,12));self.assertAlmostEqual(v[0,0],288.15,delta=.0001)
        for run,hour,field,level in [('2026100706',3,'t',850),('2026100712',6,'t',850),('2026100712',3,'t',500),('2026100712',3,'u',850)]:
            with self.assertRaises(ValueError):decode(data,run,hour,field,level)
    def test_contours_native_analytic_mask(self):
        lat=np.linspace(47,55,81);lon=np.linspace(6,15,91);values=540+2*(lat[:,None]-47)+2*(lon[None,:]-6);fc=contours(values,lat,lon,4);self.assertTrue(fc['features'])
        for f in fc['features']:
            for x,y in f['geometry']['coordinates'][2:-2]:
                if 6.4<x<14.6 and 47.4<y<54.6:self.assertAlmostEqual(540+2*(y-47)+2*(x-6),f['properties']['level'],delta=.001)
        values[30:50,30:50]=np.nan;fc=contours(values,lat,lon,4)
        self.assertFalse(any(9.1<x<10.8 and 50.1<y<51.8 for f in fc['features'] for x,y in f['geometry']['coordinates']))
    def test_same_field_components_and_mask(self):
        with tempfile.TemporaryDirectory() as td:
            lat=np.linspace(47,52.5,12);lon=np.linspace(6,11.5,12);values={'t':288.15,'relhum':80,'fi':560,'pmsl':1012,'u':30,'v':10};fields={(3,f,l):np.full((12,12),values[f]) for f,l in COMPONENTS};fields[(3,'t',850)][0,0]=np.nan;stamp=datetime(2026,10,7,12,tzinfo=timezone.utc);frames=write_fields(Path(td),'icon-eu',stamp,7,fields,lat,lon,(3,));d=json.loads(gzip.decompress((Path(td)/frames[0]['file']).read_bytes()));self.assertIsNone(d['thetae'][0]);self.assertEqual(d['unit'],'°C');self.assertEqual(d['time'],'2026-10-07T15:00:00+00:00');self.assertTrue(d['wind']);self.assertEqual(set(('height','pressure','humidity')).intersection(d),{'height','pressure','humidity'})
if __name__=='__main__':unittest.main()
