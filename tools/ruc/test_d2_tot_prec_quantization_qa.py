import unittest
import numpy as np
from d2_tot_prec_quantization_qa import packing_quantum, assess_original_packing

class OriginalQuantizationProofTests(unittest.TestCase):
    def meta(self, scale, end, **kwargs):
        m = dict(packingType='grid_ccsds', binaryScaleFactor=scale,
                 decimalScaleFactor=0, referenceValue=0.0, bitsPerValue=16,
                 bitmapPresent=1, numberOfPoints=4, stepType='accum',
                 startStep=0, endStep=end)
        m.update(kwargs)
        return m

    def test_ccsds_quantum_and_exact_1_step_rounding_case(self):
        self.assertEqual(packing_quantum(self.meta(-12, 2)), 2 ** -12)
        p = np.array([0.0, 2**-12, 0.0, np.nan])
        c = np.array([0.0, 0.0, 1.0, np.nan])
        r = assess_original_packing(p, c, self.meta(-12, 2), self.meta(-11, 3),
                                    lead=3, latitudes=[48,49,50,51],
                                    longitudes=[6,7,8,9])
        self.assertTrue(r['allNegativeCellsRoundingCompatible'])
        self.assertEqual(r['negativeCells'], 1)
        self.assertEqual(r['negativeCellsNotExplainedByPacking'], 0)
        self.assertEqual(r['samples'][0]['nativeIndex'], 1)
        self.assertFalse(r['productionApproved'])
        self.assertEqual(p[1], 2**-12)  # zero or NoData not substituted

    def test_larger_negative_step_remains_unexplained(self):
        p = [0, 0.2, 4.0, np.nan]
        c = [0, 0, 0.0, np.nan]
        r = assess_original_packing(p, c, self.meta(-12, 2), self.meta(-11, 3), lead=3)
        self.assertFalse(r['allNegativeCellsRoundingCompatible'])
        self.assertEqual(r['negativeCellsNotExplainedByPacking'], 2)

    def test_wmo_interval_reference_bitmap_and_quantum_mismatch_fail(self):
        p = [0, 2**-12, 3, np.nan]
        c = [0, 0, 4, np.nan]
        for kw in ({'startStep': 1}, {'endStep': 99}, {'stepType': 'instant'},
                   {'referenceValue': 1.0}, {'bitmapPresent': 0},
                   {'numberOfPoints': 8}, {'bitsPerValue': 12}):
            with self.subTest(meta=kw):
                r = assess_original_packing(p, c, self.meta(-12, 2, **kw),
                                            self.meta(-11, 3), lead=3)
                self.assertFalse(r['allNegativeCellsRoundingCompatible'])
        r = assess_original_packing(p, c, self.meta(-11, 2), self.meta(-12, 3), lead=3)
        self.assertFalse(r['allNegativeCellsRoundingCompatible'])

    def test_bitmap_drift_is_explicit_not_zero(self):
        r = assess_original_packing([0, 2**-12, np.nan, 1],
                                    [0, 0, 0, 1], self.meta(-12, 2),
                                    self.meta(-11, 3), lead=3)
        self.assertEqual(r['bitmapDisagreementCells'], 1)
        self.assertFalse(r['allNegativeCellsRoundingCompatible'])

    def test_geometry_and_infinity_fail(self):
        with self.assertRaisesRegex(ValueError, 'geometry'):
            assess_original_packing([0, 1], [0], self.meta(-12, 2),
                                    self.meta(-11, 3), lead=3)
        with self.assertRaisesRegex(ValueError, 'Infinity'):
            assess_original_packing([0, float('inf'), 0, 0], [0, 0, 0, 0],
                                    self.meta(-12, 2), self.meta(-11, 3), lead=3)

if __name__ == '__main__':
    unittest.main()
