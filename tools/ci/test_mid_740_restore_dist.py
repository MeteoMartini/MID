import hashlib
from pathlib import Path
import stat
import tempfile
import unittest
import zipfile
import warnings

from mid_740_installer_archive_shadow import Rejected, git_blob_sha, git_tree_sha
from mid_740_restore_dist import restore_dist


class RestoreDistTests(unittest.TestCase):
    def test_verified_restore_and_rejections(self):
        files = {'index.html': b'<html>', 'version.json': b'{"version":"0.9.85.486"}', 'sw.js': b'worker'}
        tree = git_tree_sha({name: ('100644', git_blob_sha(data)) for name, data in files.items()})
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            for variant in ('valid', 'group-only', 'changed', 'traversal', 'symlink', 'unsafe-mode', 'wrong-version'):
                with self.subTest(variant=variant):
                    path = base / (variant + '.zip')
                    target = base / variant
                    with zipfile.ZipFile(path, 'w') as archive:
                        for name, data in files.items():
                            entry = zipfile.ZipInfo('dist/' + name)
                            entry.create_system = 3
                            mode = stat.S_IFREG | 0o644
                            if name == 'index.html':
                                if variant == 'group-only':
                                    mode |= 0o010
                                elif variant == 'changed':
                                    data = b'changed'
                                elif variant == 'traversal':
                                    entry.filename = 'dist/../index.html'
                                elif variant == 'symlink':
                                    mode = stat.S_IFLNK | 0o777
                                elif variant == 'unsafe-mode':
                                    mode |= 0o111
                            entry.external_attr = mode << 16
                            archive.writestr(entry, data)
                    digest = hashlib.sha256(path.read_bytes()).hexdigest()
                    version = '0.9.85.487' if variant == 'wrong-version' else '0.9.85.486'
                    if variant in ('valid', 'group-only'):
                        report = restore_dist(path, target, digest, tree, version)
                        self.assertEqual(report['files'], len(files))
                        self.assertFalse(report['recoveryAuthorized'])
                        self.assertEqual((target / 'dist/index.html').read_bytes(), files['index.html'])
                        with self.assertRaises(FileExistsError):
                            restore_dist(path, target, digest, tree, version)
                    else:
                        with self.assertRaises(Rejected):
                            restore_dist(path, target, digest, tree, version)
                        self.assertFalse(target.exists())

    def test_nested_dist_name_and_duplicate_file_inventory(self):
        files = {'index.html': b'html', 'version.json': b'{"version":"0.9.85.486"}',
                 'sw.js': b'worker', 'dist/x': b'nested', 'x': b'root'}
        tree = git_tree_sha({n: ('100644', git_blob_sha(b)) for n, b in files.items()})
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            for duplicate in (False, True):
                path = base / ('duplicate.zip' if duplicate else 'valid.zip')
                target = base / ('bad' if duplicate else 'good')
                with zipfile.ZipFile(path, 'w') as archive, warnings.catch_warnings():
                    warnings.simplefilter('ignore', UserWarning)
                    for name, data in [*files.items(), *([('x', b'root')] if duplicate else [])]:
                        entry = zipfile.ZipInfo('dist/' + name); entry.create_system = 3
                        entry.external_attr = (stat.S_IFREG | 0o644) << 16
                        archive.writestr(entry, data)
                digest = hashlib.sha256(path.read_bytes()).hexdigest()
                if duplicate:
                    with self.assertRaisesRegex(Rejected, 'UNSAFE_DIST_ENTRY'):
                        restore_dist(path, target, digest, tree, '0.9.85.486')
                    self.assertFalse(target.exists())
                else:
                    self.assertEqual(restore_dist(path, target, digest, tree, '0.9.85.486')['files'], 5)



if __name__ == '__main__':
    unittest.main()
