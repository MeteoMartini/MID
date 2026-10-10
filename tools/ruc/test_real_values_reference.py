"""Frozen decoded DWD cells: canonical conversion, QC and exact wire golden."""
import copy
import json
from pathlib import Path
import unittest
from scientific_values_reference import replay


class RealValuesReferenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        path=Path(__file__).resolve().parents[2]/'docs/implementation/MID_SCIENTIFIC_VALUES_REFERENCE_2026-10-10.json'
        cls.fixture=json.loads(path.read_text())

    def test_real_decoded_cells_exact_packing_and_input_unchanged(self):
        original=copy.deepcopy(self.fixture)
        self.assertEqual(replay(self.fixture),self.fixture['golden'])
        self.assertEqual(self.fixture,original)
        self.assertEqual(len(self.fixture['sourceFiles']),66)
        self.assertEqual(self.fixture['members'],list(range(1,21)))
        self.assertEqual(self.fixture['nativePointCount'],542040)
        self.assertEqual(self.fixture['maximumPrecipitationConservationErrorMm'],0)

    def test_changed_native_value_invalidates_wire_golden(self):
        fixture=copy.deepcopy(self.fixture)
        index=next(i for i,v in enumerate(fixture['nativeSamples']['temperature_2m'][1]) if v is not None)
        fixture['nativeSamples']['temperature_2m'][1][index]+=1
        self.assertNotEqual(replay(fixture)['deterministicPackedSha256'],fixture['golden']['deterministicPackedSha256'])

    def test_wrong_units_fail_before_packing(self):
        fixture=copy.deepcopy(self.fixture);fixture['units']['pressure_msl']='K'
        with self.assertRaises(ValueError):replay(fixture)

    def test_backward_precipitation_fails(self):
        fixture=copy.deepcopy(self.fixture)
        index=next(i for i,v in enumerate(fixture['nativeSamples']['precipitation_acc'][0]) if v is not None)
        fixture['nativeSamples']['precipitation_acc'][1][index]=-1
        with self.assertRaises(ValueError):replay(fixture)

    def test_duplicate_or_missing_whole_member_fails(self):
        fixture=copy.deepcopy(self.fixture);fixture['members'][1]=fixture['members'][0]
        with self.assertRaises(ValueError):replay(fixture)
        fixture=copy.deepcopy(self.fixture)
        fixture['epsAccumulationMm'][1][0]=[None]*len(fixture['indices'])
        with self.assertRaises(ValueError):replay(fixture)
