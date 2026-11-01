#!/usr/bin/env python3
"""Offline adversarial tests for bounded optional RUC staging."""
import threading
import time
import unittest
from optional_stage_parallel import run_optional_downloads


class OptionalStageConcurrencyTests(unittest.TestCase):
    def test_empty_no_run(self):
        self.assertEqual(run_optional_downloads([], lambda x: 1), [])

    def test_order_deterministic_even_when_completion_is_reversed(self):
        gate = threading.Event()
        def worker(n):
            if n == 1:
                self.assertTrue(gate.wait(timeout=3))
            if n == 2:
                gate.set()
            return n * 10
        rows = run_optional_downloads([1, 2], worker)
        self.assertEqual([(s, value) for s, value, _ in rows], [(1, 10), (2, 20)])
        self.assertTrue(all(error is None for _, _, error in rows))

    def test_bounded_by_two(self):
        active = 0
        peak = 0
        guard = threading.Lock()
        def worker(_):
            nonlocal active, peak
            with guard:
                active += 1
                peak = max(peak, active)
            time.sleep(.02)
            with guard:
                active -= 1
            return 'ok'
        rows = run_optional_downloads(range(8), worker)
        self.assertEqual(len(rows), 8)
        self.assertLessEqual(peak, 2)
        self.assertEqual(peak, 2)

    def test_one_slot_no_overlapping_job(self):
        active = 0
        peak = 0
        lock = threading.Lock()
        def worker(x):
            nonlocal active, peak
            with lock:
                active += 1
                peak = max(peak, active)
            time.sleep(.01)
            with lock:
                active -= 1
            return x
        run_optional_downloads(range(4), worker, max_concurrent=1)
        self.assertEqual(peak, 1)

    def test_failure_is_explicit_and_other_optional_source_survives(self):
        def worker(x):
            if x == 'bad':
                raise RuntimeError('bad GRIB')
            return ['genuine GRIB']
        rows = run_optional_downloads(['good', 'bad', 'good2'], worker)
        self.assertEqual([r[0] for r in rows], ['good', 'bad', 'good2'])
        self.assertEqual(rows[0][1], ['genuine GRIB'])
        self.assertIsNone(rows[1][1])
        self.assertIsInstance(rows[1][2], RuntimeError)
        self.assertEqual(rows[2][1], ['genuine GRIB'])

    def test_duplicate_specs_rejected(self):
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            run_optional_downloads(['VIS', 'VIS'], lambda x: 1)

    def test_invalid_concurrency_fail_closed(self):
        for value in (0, 3, -1, 2.0, True, None, '2'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                run_optional_downloads(['A'], lambda x: 1, max_concurrent=value)

    def test_no_exception_is_lost(self):
        def worker(x):
            if x == 'a':
                raise ValueError('unsupported units')
            raise OSError('timeout')
        rows = run_optional_downloads(['a', 'b'], worker)
        self.assertIsInstance(rows[0][2], ValueError)
        self.assertIsInstance(rows[1][2], OSError)


if __name__ == '__main__':
    unittest.main()
