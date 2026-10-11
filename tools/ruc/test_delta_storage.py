import unittest
import numpy as np
from storage_audit import delta_byteplanes, restore_delta_byteplanes


class DeltaStorageTest(unittest.TestCase):
    def test_all_16bit_patterns_and_missing_roundtrip(self):
        for words in [np.arange(65536,dtype='<u2'), np.array([32768,65535,0,32767,32768],dtype='<u2'), np.zeros(0,dtype='<u2')]:
            raw=words.tobytes()
            self.assertEqual(restore_delta_byteplanes(delta_byteplanes(raw)),raw)

    def test_incomplete_words_rejected(self):
        for fn in [delta_byteplanes,restore_delta_byteplanes]:
            with self.assertRaises(ValueError): fn(b'x')


if __name__=='__main__': unittest.main()
