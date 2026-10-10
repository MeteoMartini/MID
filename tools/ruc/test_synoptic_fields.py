import unittest,tempfile,json,sys,gzip
from pathlib import Path
from datetime import datetime,timezone
import numpy as np
from eccodes import codes_grib_new_from_samples,codes_set,codes_set_values,codes_get_message,codes_release
from build_synoptic_fields import decode,contours,write_fields,COMPONENTS,theta_e,CORE_HOURS,HOURS,EXTENDED_HOURS,extended_hours
class SynopticTest(unittest.TestCase):
    def test_independent_cloud_weather_hours_and_budget(self):
        from build_cloud_weather_fields import cloud_hours
        from prepare_ruc_pages import fit_synoptic_budget
        stamp=datetime(2026,10,7,12,tzinfo=timezone.utc)
        for model in ('icon-d2','icon-eu','icon'):self.assertEqual(cloud_hours(model,stamp)[:13],tuple(range(13)))
        self.assertEqual(cloud_hours('icon-eu',stamp)[-1],120)
        self.assertEqual(cloud_hours('icon',stamp)[-1],180)
        self.assertEqual(cloud_hours('icon',stamp.replace(hour=6))[-1],120)
        product={'frames':[{'hour':h,'bytes':1000} for h in CORE_HOURS],'cloudWeatherFrames':[{'hour':h,'bytes':10000} for h in range(13)]}
        minimal={'models':{'icon-eu':{'frames':product['frames'],'cloudWeatherFrames':[]}}}
        available=len(CORE_HOURS)*1000+len((json.dumps(minimal,separators=(',',':'),ensure_ascii=False)+'\n').encode())+3000
        result=fit_synoptic_budget({'models':{'icon-eu':product}},available)
        self.assertEqual(len(result['models']['icon-eu']['frames']),len(CORE_HOURS));self.assertFalse(result['models']['icon-eu']['cloudWeatherFrames'])
    def test_hourly_cloud_weather_precedes_optional_synoptic_density(self):
        from prepare_ruc_pages import fit_synoptic_budget
        import copy
        product={'frames':[{'hour':h,'bytes':1000} for h in CORE_HOURS]+[{'hour':72,'bytes':30000}],
                 'cloudWeatherFrames':[{'hour':h,'bytes':100} for h in range(1,13)]}
        result=fit_synoptic_budget({'models':{'icon-eu':copy.deepcopy(product)}},15000)
        self.assertEqual([f['hour'] for f in result['models']['icon-eu']['cloudWeatherFrames']],list(range(1,13)))
        self.assertNotIn(72,[f['hour'] for f in result['models']['icon-eu']['frames']])
        self.assertEqual(result['cloudWeatherBudget']['pruned'],[])
        self.assertEqual(len(product['frames']),len(CORE_HOURS)+1)
    def test_cloud_weather_raw_identity_missing_and_units(self):
        for field,category,number,value in [('clct',6,1,75),('ww',19,25,61)]:
            def message(**patch):
                g=codes_grib_new_from_samples('regular_ll_sfc_grib2')
                try:
                    params={'centre':78,'Ni':12,'Nj':12,'latitudeOfFirstGridPointInDegrees':52.5,'latitudeOfLastGridPointInDegrees':47,'longitudeOfFirstGridPointInDegrees':6,'longitudeOfLastGridPointInDegrees':11.5,'iDirectionIncrementInDegrees':.5,'jDirectionIncrementInDegrees':.5,'dataDate':20261007,'dataTime':1200,'discipline':0,'parameterCategory':category,'parameterNumber':number,'typeOfFirstFixedSurface':1,'scaledValueOfFirstFixedSurface':0,'typeOfSecondFixedSurface':255,'stepUnits':1,'forecastTime':3};params.update(patch)
                    for k,v in params.items():codes_set(g,k,v)
                    codes_set(g,'bitmapPresent',1);values=np.full(144,float(value));values[0]=9999;codes_set(g,'missingValue',9999);codes_set_values(g,values);return codes_get_message(g)
                finally:codes_release(g)
            lat,lon,values=decode(message(),'2026100712',3,field,None)
            self.assertEqual(values.shape,(12,12));self.assertEqual(np.isnan(values).sum(),1);self.assertAlmostEqual(np.nanmax(values),value)
            for patch in [{'centre':7},{'parameterNumber':0},{'scaledValueOfFirstFixedSurface':2}]:
                with self.assertRaises(ValueError):decode(message(**patch),'2026100712',3,field,None)
    def test_optional_cloud_weather_atomic_pair_preserves_core_on_failure(self):
        import build_synoptic_fields as module,time,copy
        from unittest.mock import patch
        from types import SimpleNamespace
        stamp=datetime(2026,10,7,12,tzinfo=timezone.utc);lat=np.array([47.,48.]);lon=np.array([6.,7.])
        names={name:f'icon-eu_europe_regular-lat-lon_single-level_2026100712_003_2d_{name}.grib2.bz2' for name in ('clct','ww')}
        def get(url,**kwargs):return SimpleNamespace(text=f'<a href="{names[url.rstrip("/").split("/")[-1]]}">' if url.endswith('/') else '',content=url.encode(),raise_for_status=lambda:None)
        with tempfile.TemporaryDirectory() as td:
            output=Path(td);file=output/'icon-eu-003.bin';raw=gzip.compress(json.dumps({'lats':lat.tolist(),'lons':lon.tolist(),'thetae':[1,2,3,4]}).encode());file.write_bytes(raw);product={'run':stamp.isoformat(),'frames':[{'hour':3,'file':file.name,'sha256':'old','bytes':len(raw)}],'origins':[]}
            with patch.object(module.requests,'get',side_effect=get),patch.object(module,'decode',side_effect=ValueError('missing weather')):module.enrich_cloud_weather('icon-eu',product,output,time.monotonic()+10)
            self.assertEqual(file.read_bytes(),raw);self.assertNotIn('cloudWeather',product['frames'][0]);self.assertEqual(product['origins'],[])
            def decoder(payload,run,hour,field,level,native):return lat,lon,np.array([[0.,75.],[np.nan,100.]]) if field=='clct' else np.array([[0.,61.],[np.nan,86.]])
            with patch.object(module.requests,'get',side_effect=get),patch.object(module,'decode',side_effect=decoder):module.enrich_cloud_weather('icon-eu',product,output,time.monotonic()+10)
            data=json.loads(gzip.decompress(file.read_bytes()));self.assertEqual(data['thetae'],[1,2,3,4]);self.assertEqual(data['cloudWeather']['cloud'],[0,750,None,1000]);self.assertEqual(data['cloudWeather']['weather'],[0,61,None,86]);self.assertTrue(product['frames'][0]['cloudWeather']);self.assertEqual(len(product['origins']),2)
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
    def test_europe_domain_actual_grib(self):
        g=codes_grib_new_from_samples('regular_ll_pl_grib2')
        try:
            for k,v in {'Ni':1377,'Nj':657,'latitudeOfFirstGridPointInDegrees':70.5,'latitudeOfLastGridPointInDegrees':29.5,'longitudeOfFirstGridPointInDegrees':-23.5,'longitudeOfLastGridPointInDegrees':62.5,'iDirectionIncrementInDegrees':.0625,'jDirectionIncrementInDegrees':.0625,'dataDate':20261007,'dataTime':1200,'typeOfLevel':'isobaricInhPa','level':850,'shortName':'t','stepUnits':1,'forecastTime':15}.items():codes_set(g,k,v)
            codes_set_values(g,np.full(1377*657,288.15));data=codes_get_message(g)
        finally:codes_release(g)
        lat,lon,values=decode(data,'2026100712',15,'t',850)
        self.assertEqual((lat[0],lat[-1],lon[0],lon[-1]),(29.5,70.5,-23.5,62.5));self.assertEqual(values.shape,(329,689));self.assertAlmostEqual(lat[1]-lat[0],.125);self.assertAlmostEqual(lon[1]-lon[0],.125)
    def test_theta_and_humidity_levels(self):
        lat=np.linspace(47,52.5,12);lon=np.linspace(6,11.5,12);x,y=np.meshgrid(lon,lat);rh=50+5*(x-6);fields={(3,f,l):np.full((12,12),{'t':288.15,'relhum':80,'fi':560,'pmsl':1012,'u':40,'v':10}[f]) for f,l in COMPONENTS};fields[(3,'relhum',700)]=rh;fields[(3,'t',850)]=280+(x-6)*3
        with tempfile.TemporaryDirectory() as td:
            stamp=datetime(2026,10,7,12,tzinfo=timezone.utc);frames=write_fields(Path(td),'icon-eu',stamp,14,fields,lat,lon,(3,));d=json.loads(gzip.decompress((Path(td)/frames[0]['file']).read_bytes()))
            self.assertTrue(d['thetaContours']['features']);self.assertTrue(all(f['properties']['level']%6==0 for f in d['thetaContours']['features']));self.assertEqual({f['properties']['level'] for f in d['humidity']['features']},{60})
    def test_optional_terms_budget_preserves_core(self):
        from prepare_ruc_pages import fit_synoptic_budget
        import copy
        payload={'models':{'icon-eu':{'frames':[{'hour':h,'bytes':1000} for h in HOURS]}}}
        full=copy.deepcopy(payload);self.assertEqual(len(fit_synoptic_budget(full,20000)['models']['icon-eu']['frames']),13)
        limited=fit_synoptic_budget(copy.deepcopy(payload),11000);hours={f['hour'] for f in limited['models']['icon-eu']['frames']};self.assertTrue(set(CORE_HOURS).issubset(hours));self.assertLess(len(hours),13)
        with self.assertRaises(ValueError):fit_synoptic_budget(copy.deepcopy(payload),1000)
    def test_optional_horizon_is_same_cycle_and_failure_preserves_core(self):
        import build_synoptic_fields as module
        from unittest.mock import patch
        stamp=datetime(2026,10,8,6,tzinfo=timezone.utc);calls=[]
        def builder(model,output,now=None,hours=HOURS,cached=None,strict_run=False):
            calls.append((model,tuple(hours),strict_run,now))
            if model=='icon-eu' and hours==(72,):raise RuntimeError('upstream unavailable')
            return {'run':stamp.isoformat(),'frames':[{'hour':h} for h in hours],'origins':[]}
        with tempfile.TemporaryDirectory() as td,patch.object(module,'restore_cache',return_value={}),patch('build_cloud_weather_fields.build'),patch.object(module,'model_product',side_effect=builder),patch.object(module,'global_product',side_effect=builder):
            result=module.build(Path(td))
        self.assertEqual([f['hour'] for f in result['models']['icon-d2']['frames']],list(HOURS))
        self.assertEqual([f['hour'] for f in result['models']['icon-eu']['frames']],sorted(set(HOURS+extended_hours('icon-eu',stamp))-{72}))
        self.assertEqual([f['hour'] for f in result['models']['gfs']['frames']],sorted(set(HOURS+extended_hours('gfs',stamp))))
        self.assertFalse(result['unavailable'])
        for model,hours,strict,now in calls:
            if hours not in (HOURS,CORE_HOURS):self.assertTrue(strict);self.assertEqual(now,stamp);self.assertNotEqual(model,'icon-d2')
    def test_horizon_budget_drops_density_before_range(self):
        from prepare_ruc_pages import fit_synoptic_budget
        payload={'models':{'gfs':{'frames':[{'hour':h,'bytes':1000} for h in HOURS+EXTENDED_HOURS]}}}
        result=fit_synoptic_budget(payload,13000)
        self.assertTrue(set(CORE_HOURS+EXTENDED_HOURS).issubset(f['hour'] for f in result['models']['gfs']['frames']))
    def test_icon_native_remap_grid_identity_and_coverage(self):
        from icon_global_grid import native_mapping,remap_native
        from unittest.mock import patch
        lat,lon=np.meshgrid(np.arange(29.5,70.51,.25),np.arange(-23.5,62.51,.25),indexing='ij')
        mapping=native_mapping(lat.ravel(),lon.ravel(),'test-grid')
        with patch('icon_global_grid.codes_get',side_effect=lambda _,k:'test-grid' if k=='uuidOfHGrid' else 9999),patch('icon_global_grid.codes_get_array',return_value=lat.ravel()):
            a,b,v=remap_native(None,mapping)
        np.testing.assert_array_equal(v,lat)
        with patch('icon_global_grid.codes_get',return_value='wrong-grid'):
            with self.assertRaises(ValueError):remap_native(None,mapping)
        with self.assertRaises(ValueError):native_mapping(np.arange(10),np.arange(10),'grid')
    def test_horizon_cycle_and_optional_icon_budget(self):
        from prepare_ruc_pages import fit_synoptic_budget
        self.assertEqual(extended_hours('icon',datetime(2026,10,8,0,tzinfo=timezone.utc))[0],180)
        self.assertEqual(extended_hours('icon',datetime(2026,10,8,6,tzinfo=timezone.utc))[0],120)
        for model,end in [('gfs',384),('ifs',360),('icon-eu',120)]:self.assertEqual(extended_hours(model,datetime.now(timezone.utc))[0],end)
        payload={'models':{id:{'frames':[{'hour':h,'bytes':1000} for h in CORE_HOURS+(60,72,120)]} for id in ('icon-eu','icon')}}
        result=fit_synoptic_budget(payload,15000)
        self.assertNotIn('icon',result['models'])
        self.assertIn(120,[f['hour'] for f in result['models']['icon-eu']['frames']])
if __name__=='__main__':unittest.main()
