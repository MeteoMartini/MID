import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

from mid_740_installer_archive_shadow import Rejected
from mid_740_stage_dist import ARCHIVE, MANIFEST, stage_dist


class StageDistTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        dist = self.root / 'dist'
        dist.mkdir()
        (dist / 'index.html').write_text('<main>MID</main>')
        (dist / 'sw.js').write_text('/* service worker */')
        (dist / 'version.json').write_text('{"version":"0.9.85.488"}')
        executable = dist / 'check.sh'
        executable.write_text('#!/bin/sh\nexit 0\n')
        executable.chmod(0o755)
        self.git('init', '-q')
        self.git('add', 'dist')
        self.git('-c', 'user.name=QA', '-c', 'user.email=qa@example.invalid',
                 '-c', 'commit.gpgsign=false', 'commit', '-qm', 'dist fixture')
        self.source = self.git('rev-parse', 'HEAD')
        self.tree = self.git('rev-parse', 'HEAD:dist')
        self.version = '0.9.85.488'
        self.command = ['python3', str(Path(__file__).with_name('mid_740_stage_dist.py').resolve())]

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.root, text=True).strip()

    def run_bundle(self, name, tree=None, source=None, version=None):
        return subprocess.run(
            [*self.command, name, tree or self.tree, source or self.source,
             version or self.version],
            cwd=self.root, capture_output=True, text=True, timeout=30,
        )

    def test_repeatable_manifest_and_independent_git_tree_restore(self):
        for name in ('first', 'second'):
            result = self.run_bundle(name)
            self.assertEqual(result.returncode, 0, result.stderr)
            report = json.loads(result.stdout)
            self.assertEqual(report['files'], 4)
            self.assertFalse(report['installerAttestationVerified'])
            self.assertFalse(report['releaseAuthorized'])
        bundle = self.root / 'first'
        archive = (bundle / ARCHIVE).read_bytes()
        self.assertEqual(archive, (self.root / 'second' / ARCHIVE).read_bytes())
        self.assertEqual(json.loads((bundle / MANIFEST).read_bytes()), {
            'schema': 'mid.740.installer-dist.v1',
            'sourceSha': self.source, 'distTreeSha': self.tree, 'version': self.version,
            'distDigest': 'sha256:' + hashlib.sha256(archive).hexdigest(),
        })
        digest = hashlib.sha256(archive).hexdigest()
        restore = Path(__file__).with_name('mid_740_restore_dist.py').resolve()
        subprocess.run(['python3', str(restore), str(bundle / ARCHIVE),
                        'restored', digest, self.tree, self.version],
                       cwd=self.root, check=True, capture_output=True, timeout=30)
        self.git('-C', 'restored', 'init', '-q')
        self.git('-C', 'restored', 'add', '-f', 'dist')
        self.assertEqual(self.git('-C', 'restored', 'write-tree', '--prefix=dist/'), self.tree)
        before = (bundle / MANIFEST).read_bytes()
        self.assertNotEqual(self.run_bundle('first').returncode, 0)
        self.assertEqual(archive, (bundle / ARCHIVE).read_bytes())
        self.assertEqual(before, (bundle / MANIFEST).read_bytes())

    def test_missing_objects_wrong_types_and_version_leave_no_bundle(self):
        cases = [
            ('unknown-source', None, 'a' * 40, None),
            ('wrong-source-type', None, self.tree, None),
            ('wrong-tree-type', self.source, None, None),
            ('wrong-version', None, None, '0.9.85.489'),
        ]
        for name, tree, source, version in cases:
            with self.subTest(name=name):
                result = self.run_bundle(name, tree, source, version)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('dist staging BLOCKED', result.stderr)
                self.assertFalse((self.root / name).exists())
        self.assertEqual(list(self.root.glob('.mid740-dist-bundle-*')), [])

    def test_symlink_destination_and_symlink_parent_preserve_target(self):
        foreign = self.root / 'foreign'
        foreign.mkdir()
        (foreign / 'sentinel').write_text('preserve')
        os.symlink(foreign, self.root / 'alias', target_is_directory=True)
        for destination in ('alias', 'alias/bundle'):
            result = self.run_bundle(destination)
            self.assertNotEqual(result.returncode, 0)
        self.assertEqual((foreign / 'sentinel').read_text(), 'preserve')
        self.assertEqual(sorted(p.name for p in foreign.iterdir()), ['sentinel'])

    def test_export_ignore_cannot_silently_drop_built_files(self):
        (self.root / '.git/info/attributes').write_text('sw.js export-ignore\n')
        result = self.run_bundle('filtered')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('DIST_TREE_MISMATCH', result.stderr)
        self.assertFalse((self.root / 'filtered').exists())

    def test_invalid_source_is_rejected_before_git(self):
        with self.assertRaisesRegex(Rejected, 'INVALID_INSTALLER_IDENTITY'):
            stage_dist('unused', 'a' * 40, 'HEAD', self.version)


if __name__ == '__main__':
    unittest.main()
