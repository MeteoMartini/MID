import hashlib
from pathlib import Path
import stat
import tempfile
import unittest
import zipfile

from mid_740_installer_archive_shadow import Rejected, git_blob_sha, git_tree_sha
from mid_740_restore_dist import restore_dist


class RestoreDistTests(unittest.TestCase):
    def test_verified_restore_and_rejections(self):
        files = {'index.html': b'<html>', 'version.json': b'{"version":"0.9.85.486"}', 'sw.js': b'worker'}
        tree = git_tree_sha({name: ('100644', git_blob_sha(data)) for name, data in files.items()})
        with tempfile.TemporaryDirectory() as tmp:
            base = Path(tmp)
            for variant in ('valid', 'changed', 'traversal', 'symlink', 'unsafe-mode', 'wrong-version'):
                with self.subTest(variant=variant):
                    path = base / (variant + '.zip')
                    target = base / variant
                    with zipfile.ZipFile(path, 'w') as archive:
                        for name, data in files.items():
                            entry = zipfile.ZipInfo('dist/' + name)
                            entry.create_system = 3
                            mode = stat.S_IFREG | 0o644
                            if name == 'index.html':
                                if variant == 'changed':
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
                    if variant == 'valid':
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


if __name__ == '__main__':
    unittest.main()
