import datetime as dt,json,unittest
from qualify_clms_stac import parse_collection,admit_item,COLLECTIONS,BANDS
now=dt.datetime(2026,11,2,12,0,tzinfo=dt.timezone.utc)
def item(kind='GFSC'):
 product='CLMS_WSI_GFSC_060m_T33TUN_20261101P7D_COMB_V102' if kind=='GFSC' else 'CLMS_WSI_FSC_020m_T32TNR_20261101T102814_S2B_V200'
 prefix='s3://eodata/CLMS/bio-geophysical/snow_cover_extent/'+COLLECTIONS[kind]+'/2026/11/01/'+product+'/'
 return {'type':'Feature','id':product,'collection':COLLECTIONS[kind],
  'bbox':[9.1,45.1,12.2,47.9],'properties':{'datetime':'2026-11-01T00:00:00Z' if kind=='GFSC' else '2026-11-01T10:28:14Z'},
  'assets':{**{name:{'href':prefix+product+'_'+name+'.tif'} for name in BANDS[kind]},
   'Product':{'href':'https://zipper.dataspace.copernicus.eu/odata/v1/Products(abc)/$value'}}}
def response(kind='GFSC',count=2):
 return json.dumps({'type':'FeatureCollection','features':[item(kind)],'numberReturned':1,'numberMatched':count}).encode()
class ClmsStacTests(unittest.TestCase):
 def test_real_original_fsc_gfsc_band_matrices(self):
  for kind in ('FSC','GFSC'):
   row=admit_item(item(kind),kind,now)
   self.assertFalse(row['productionApproved'])
   self.assertFalse(row['pixelDataVerified'])
   self.assertFalse(row['qaFlagsDecoded'])
   self.assertIn('QAFLAGS',row['requiredBands'])
   self.assertEqual(row['hasAcquisitionTimeRaster'],kind=='GFSC')
 def test_page_is_partial_and_not_coverage_claim(self):
  result=parse_collection(response(), 'GFSC',now)
  self.assertEqual(result['matchedOriginalProducts'],2)
  self.assertTrue(result['partialCoverage'])
  self.assertEqual(result['returnedProducts'],1)
  self.assertFalse(result['pixelDataVerified'])
 def test_untrusted_source_footprint_and_time_are_not_snowfree(self):
  for changes in ({'bbox':[40,40,41,41]},
                  {'properties':{'datetime':'2026-12-01T00:00:00Z'}},
                  {'properties':{'datetime':'2026-02-01T00:00:00Z'}},
                  {'collection':'wrong'}):
   v=item();v.update(changes)
   with self.assertRaises(ValueError):admit_item(v,'GFSC',now)
 def test_missing_quality_or_timestamp_rasters_do_not_pass(self):
  for band in BANDS['GFSC']:
   v=item();del v['assets'][band]
   with self.assertRaises(ValueError):admit_item(v,'GFSC',now)
 def test_reject_host_confusion_and_path_traversal(self):
  for url in ('https://evil.invalid/test.tif',
              's3://eodata/CLMS/other/evil.tif',
              item()['assets']['GF']['href'].replace('/2026/','/../2026/')):
   v=item();v['assets']['GF']['href']=url
   with self.assertRaises(ValueError):admit_item(v,'GFSC',now)
 def test_asset_bands_cannot_be_spliced_across_products_or_days(self):
  for kind in ('FSC','GFSC'):
   for band in BANDS[kind]:
    with self.subTest(kind=kind,band=band):
     v=item(kind)
     valid=v['assets'][band]['href']
     # Same collection, same band, but a different product is still untrusted.
     other_id=v['id'].replace('V102','V103').replace('V200','V201')
     v['assets'][band]['href']=valid.replace(v['id'],other_id)
     with self.assertRaisesRegex(ValueError,'not bound'):
      admit_item(v,kind,now)
     v['assets'][band]['href']=valid.replace('/2026/11/01/','/2026/10/31/')
     with self.assertRaisesRegex(ValueError,'not bound'):
      admit_item(v,kind,now)
     v['assets'][band]['href']=valid.replace('/'+v['id']+'_','/extra/'+v['id']+'_')
     with self.assertRaisesRegex(ValueError,'not bound'):
      admit_item(v,kind,now)
     v['assets'][band]['href']=valid+'?untrusted=1'
     with self.assertRaisesRegex(ValueError,'not bound'):
      admit_item(v,kind,now)

 def test_fsc_timestamp_must_match_exact_s2_acquisition_second(self):
  v=item('FSC')
  v['properties']['datetime']='2026-11-01T10:28:15Z'
  with self.assertRaisesRegex(ValueError,'acquisition UTC timestamp'):
   admit_item(v,'FSC',now)
  self.assertEqual(admit_item(item('FSC'),'FSC',now)['pixelDataVerified'],False)

 def test_no_artificial_empty_or_unbounded_catalogue(self):
  for obj in ({'type':'FeatureCollection','features':[],'numberMatched':0},
              {'type':'FeatureCollection','features':[item()]*26,'numberMatched':26}):
   with self.assertRaises(ValueError):parse_collection(json.dumps(obj).encode(),'GFSC',now)
if __name__=='__main__':unittest.main()
