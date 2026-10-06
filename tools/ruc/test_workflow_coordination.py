import unittest
from check_ruc_health import probe_pages
from check_ruc_snapshot_current import snapshot_current


class Coordination(unittest.TestCase):
    def test_pages_converges_before_worker(self):
        responses = iter([{'schema':'mid.dwd.ruc.grid.v2','storageProfile':'pages-free-v1','run':r} for r in ['old','new']])
        urls=[]
        def fetch(url, timeout):
            urls.append(url)
            return next(responses)
        self.assertEqual(probe_pages('https://example.test/ruc/', 'new', fetcher=fetch, sleeper=lambda _:None),2)
        self.assertIn('mid_ruc_probe=2',urls[-1])
        with self.assertRaisesRegex(RuntimeError,'pages-publication'):
            probe_pages('https://example.test/ruc/', 'new',attempts=1,fetcher=lambda *_:{'run':'old'},sleeper=lambda _:None)

    def test_snapshot_never_reuses_changed_or_unknown_pointer(self):
        def fetch(run):
            return lambda *_:{'schema':'mid.dwd.ruc.grid.v2','storageProfile':'pages-free-v1','run':run}
        self.assertTrue(snapshot_current('https://example.test/ruc/','same',fetch('same')))
        self.assertFalse(snapshot_current('https://example.test/ruc/','old',fetch('new')))
        self.assertFalse(snapshot_current('https://example.test/ruc/','new',fetch('old')))
        self.assertFalse(snapshot_current('https://example.test/ruc/','',fetch('same')))
        with self.assertRaises(RuntimeError):
            snapshot_current('https://example.test/ruc/','same',lambda *_:{'run':'same'})


if __name__ == '__main__':
    unittest.main()
