import unittest
import numpy as np
from pressure_contour_spacing import pressure_spacing,line_spacing
from build_synoptic_fields import contours

class PressureSpacingTest(unittest.TestCase):
    def test_linear_physical_gradient(self):
        lat=np.linspace(48,52,41);lon=np.linspace(6,10,41)
        values=1000+12*(lat[:,None]-48)+np.zeros((41,41))
        gradient=pressure_spacing(values,lat,lon)
        self.assertTrue(np.allclose(gradient,12/111.2))
        self.assertAlmostEqual(line_spacing(gradient,lat,lon,np.array([[7,49],[8,50],[9,51]])),111.2/12,places=3)

    def test_actual_one_hpa_levels_and_missing_mask(self):
        lat=np.linspace(48,52,41);lon=np.linspace(6,10,41)
        values=1000+2*(lat[:,None]-48)+3*(lon[None,:]-6)
        values[15:25,15:25]=np.nan
        fc=contours(values,lat,lon,1,pressure=True)
        levels={f['properties']['level'] for f in fc['features']}
        self.assertTrue({1001,1002,1003,1005,1010}<=levels)
        for feature in fc['features']:
            self.assertTrue(0<feature['properties']['spacingKm']<=5000)
            self.assertTrue(np.isfinite(feature['geometry']['coordinates']).all())

if __name__=='__main__':unittest.main()
