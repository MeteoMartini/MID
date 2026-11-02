"""Synthetic local GeoTIFF adversarial tests, NOT authentic CDSE source admission."""
import datetime as dt
from pathlib import Path
import tempfile
import unittest
import numpy as np
import rasterio
from rasterio.transform import from_origin
from qualify_clms_cog import qualify
from qualify_clms_stac import BANDS, COLLECTIONS

NOW=dt.datetime(2026,11,2,12,tzinfo=dt.timezone.utc)

def original(kind):
    product = ('CLMS_WSI_FSC_020m_T32TNR_20261101T102814_S2B_V200' if kind=='FSC'
               else 'CLMS_WSI_GFSC_060m_T33TUN_20261101P7D_COMB_V102')
    stamp='2026-11-01T10:28:14Z' if kind=='FSC' else '2026-11-01T00:00:00Z'
    prefix=f's3://eodata/CLMS/bio-geophysical/snow_cover_extent/{COLLECTIONS[kind]}/2026/11/01/{product}/{product}_'
    return {'type':'Feature','id':product,'collection':COLLECTIONS[kind],
            'bbox':[9.1,45.1,12.9,47.9], 'properties':{'datetime':stamp},
            'assets':{band:{'href':prefix+band+'.tif'} for band in BANDS[kind]}}

def write_fixture(root, kind, *, invalid_fraction=False, wrong_zone=False, misalign=False,
                  masked_zero=False, invalid_qa=False, unknown_code=False):
    item=original(kind)
    zone=32 if kind=='FSC' else 33
    x=600_000 if kind=='FSC' else 280_000
    res=20 if kind=='FSC' else 60
    for band in BANDS[kind]:
        if band==('FSCOG' if kind=='FSC' else 'GF'):
            data=np.full((64,64),25,dtype=np.uint8)
            data[0,0]=0
            data[0,1]=211 if unknown_code else 255 if invalid_fraction else 0
        elif band==('FSCOG-QA' if kind=='FSC' else 'GF-QA'):
            data=np.full((64,64),1,dtype=np.uint8)
            if invalid_qa:data[0,0]=255
        else:
            data=np.zeros((64,64),dtype=np.uint8)
        nodata=255 if band in ('FSCOG','GF','FSCOG-QA','GF-QA') else None
        transform=from_origin(x+(20 if misalign and band=='QAFLAGS' else 0),5_200_000,res,res)
        with rasterio.open(root/(item['id']+'_'+band+'.tif'),'w',driver='GTiff',height=64,width=64,
            count=1,dtype='uint8',crs=f'EPSG:{32600+(zone+1 if wrong_zone else zone)}',
            transform=transform,tiled=True,blockxsize=16,blockysize=16,nodata=nodata) as dst:
            dst.write(data,1)
            if masked_zero and band in ('FSCOG','GF'):
                mask=np.full((64,64),255,dtype=np.uint8)
                mask[0,0]=0
                dst.write_mask(mask)
    return item

class LocalCogTests(unittest.TestCase):
    def check(self,kind,**kwargs):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            item=write_fixture(root,kind,**kwargs)
            return qualify(item,kind,root,NOW)

    def test_both_product_matrices_and_no_production_approval(self):
        for kind in ('FSC','GFSC'):
            with self.subTest(kind=kind):
                result=self.check(kind)
                self.assertTrue(result['localRasterBytesVerified'])
                self.assertFalse(result['authenticatedOriginalBytesVerified'])
                self.assertFalse(result['productionApproved'])
                self.assertFalse(result['qaFlagsDecoded'])
                self.assertEqual(result['zeroPercentCandidatePixels'],2)
                self.assertEqual(result['fractionWithValidQualityCandidatePixels'],4096)
                self.assertEqual(set(result['localBandAssetDigests']),set(BANDS[kind]))
                self.assertTrue(all(len(v['sha256'])==64 for v in result['localBandAssetDigests'].values()))

    def test_missing_mask_and_invalid_quality_are_not_zero(self):
        self.assertEqual(self.check('FSC',invalid_fraction=True)['zeroPercentCandidatePixels'],1)
        self.assertEqual(self.check('FSC',masked_zero=True)['zeroPercentCandidatePixels'],1)
        self.assertEqual(self.check('GFSC',invalid_qa=True)['zeroPercentCandidatePixels'],1)

    def test_georeference_and_asset_integrity(self):
        for change in ({'wrong_zone':True},{'misalign':True}):
            with self.assertRaisesRegex(ValueError,'UTM|geometry drift'):
                self.check('FSC',**change)
        with self.assertRaisesRegex(ValueError,'Unknown fraction code'):
            self.check('GFSC',unknown_code=True)
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            item=write_fixture(root,'GFSC')
            (root/(item['id']+'_AT.tif')).unlink()
            with self.assertRaisesRegex(ValueError,'missing a band'):
                qualify(item,'GFSC',root,NOW)

    def test_stale_product_and_symlink_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            item=write_fixture(root,'FSC')
            item['properties']['datetime']='2026-10-01T10:28:14Z'
            with self.assertRaises(ValueError):qualify(item,'FSC',root,NOW)
            item=original('FSC')
            target=root/(item['id']+'_QAFLAGS.tif')
            target.unlink();target.symlink_to(root/(item['id']+'_FSCOG.tif'))
            with self.assertRaisesRegex(ValueError,'escapes'):
                qualify(item,'FSC',root,NOW)

if __name__=='__main__':unittest.main()
