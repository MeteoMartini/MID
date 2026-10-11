import unittest
import numpy as np
from pressure_centers import pressure_centers


class PressureCentersTest(unittest.TestCase):
    def setUp(self):
        self.lats = np.linspace(40, 60, 101)
        self.lons = np.linspace(-10, 20, 151)
        self.lat, self.lon = np.meshgrid(self.lats, self.lons, indexing='ij')

    def test_high_and_low_have_correct_position_and_native_value(self):
        field = 1010 + 15*np.exp(-((self.lat-50)**2+(self.lon-0)**2)/5) - 20*np.exp(-((self.lat-50)**2+(self.lon-12)**2)/5)
        centers = pressure_centers(field, self.lats, self.lons)
        self.assertEqual({c['type'] for c in centers}, {'H', 'T'})
        for center in centers:
            self.assertAlmostEqual(center['lat'], 50, delta=.3)
            self.assertAlmostEqual(center['lon'], 0 if center['type']=='H' else 12, delta=.3)
            self.assertAlmostEqual(center['value'], 1025 if center['type']=='H' else 990, delta=.3)

    def test_constant_slope_saddle_and_edge_have_no_false_center(self):
        for field in [np.full(self.lat.shape, 1010), 1000+self.lon, 1010+(self.lat-50)*(self.lon-5)/20,
                      1010+15*np.exp(-((self.lat-40)**2+self.lon**2)/3)]:
            self.assertEqual(pressure_centers(field,self.lats,self.lons), [])

    def test_pages_budget_keeps_near_d2_density_before_other_optional_terms(self):
        from prepare_ruc_pages import fit_synoptic_budget
        core=(0,3,6,9,12,18,24,36,48)
        payload={'models':{'icon-d2':{'frames':[{'hour':h,'bytes':1000} for h in core+(1,2,4,5)]},
                           'icon-eu':{'frames':[{'hour':h,'bytes':1000} for h in core]+[{'hour':15,'bytes':20000}]}}}
        result=fit_synoptic_budget(payload,25000)
        self.assertTrue(set(range(7)).issubset(f['hour'] for f in result['models']['icon-d2']['frames']))
        self.assertNotIn(15,[f['hour'] for f in result['models']['icon-eu']['frames']])

    def test_missing_neighbourhood_and_shallow_noise_are_rejected(self):
        field = 1010+15*np.exp(-((self.lat-50)**2+self.lon**2)/5)
        field[50,50] = np.nan
        self.assertEqual(pressure_centers(field,self.lats,self.lons), [])
        field = 1010+.2*np.sin(self.lat*10)*np.cos(self.lon*10)
        self.assertEqual(pressure_centers(field,self.lats,self.lons), [])


if __name__ == '__main__':
    unittest.main()
