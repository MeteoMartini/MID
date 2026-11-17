import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
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

    def run_bundle(self, name, tree=None, source=None, version=None, extra=()):
        return subprocess.run(
            [*self.command, name, tree or self.tree, source or self.source,
             version or self.version, *extra],
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

    def snapshot(self, variant='valid'):
        directory = self.root / ('snapshot-' + variant)
        directory.mkdir()
        files = {}
        with tarfile.open(directory / 'release.tar.gz', 'w:gz') as archive:
            for path in sorted((self.root / 'dist').iterdir()):
                name = 'dist/' + path.name
                data = path.read_bytes()
                files[name] = hashlib.sha256(data).hexdigest()
                if variant == 'content' and path.name == 'index.html':
                    data = b'foreign build'
                member = tarfile.TarInfo(name)
                member.size = len(data)
                member.mode = path.stat().st_mode & 0o777
                if variant == 'mode' and path.name == 'check.sh':
                    member.mode = 0o644
                archive.addfile(member, io.BytesIO(data))
            data = b'original metadata'
            files['producer-meta.json'] = hashlib.sha256(data).hexdigest()
            if variant == 'outside-dist':
                data = b'changed metadata'
            member = tarfile.TarInfo('producer-meta.json')
            member.size = len(data)
            member.mode = 0o644
            archive.addfile(member, io.BytesIO(data))
        archive_sha = hashlib.sha256((directory / 'release.tar.gz').read_bytes()).hexdigest()
        meta = {'schema': 1, 'event': self.source, 'archiveSha256': archive_sha, 'files': files}
        if variant == 'event':
            meta['event'] = 'b' * 40
        encoded = (json.dumps(meta) + '\n').encode()
        (directory / 'manifest.json').write_bytes(encoded)
        manifest_sha = hashlib.sha256(encoded).hexdigest()
        if variant == 'manifest':
            (directory / 'manifest.json').write_bytes(encoded + b' ')
        if variant == 'archive':
            with (directory / 'release.tar.gz').open('ab') as output:
                output.write(b'changed')
        return directory, manifest_sha, archive_sha

    def test_original_snapshot_binds_source_tree_and_full_archive(self):
        directory, manifest_sha, archive_sha = self.snapshot()
        args = ('--snapshot-directory', str(directory), '--snapshot-sha', manifest_sha)
        result = self.run_bundle('bound', extra=args)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = json.loads(result.stdout)
        self.assertTrue(report['snapshotManifestVerified'])
        self.assertFalse(report['installerAttestationVerified'])
        manifest = json.loads((self.root / 'bound' / MANIFEST).read_bytes())
        self.assertEqual(manifest['sourceSha'], self.source)
        self.assertEqual(manifest['snapshotManifestSha256'], manifest_sha)
        self.assertEqual(manifest['snapshotArchiveSha256'], archive_sha)

    def test_snapshot_corruption_event_and_mode_mismatch_publish_nothing(self):
        for variant in ('content', 'mode', 'event', 'manifest', 'archive', 'outside-dist'):
            with self.subTest(variant=variant):
                directory, digest, _ = self.snapshot(variant)
                result = self.run_bundle('rejected-' + variant, extra=(
                    '--snapshot-directory', str(directory), '--snapshot-sha', digest,
                ))
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('dist staging BLOCKED', result.stderr)
                self.assertFalse((self.root / ('rejected-' + variant)).exists())
        self.assertEqual(list(self.root.glob('.mid740-dist-bundle-*')), [])

    def test_snapshot_directory_alias_and_missing_digest_fail_closed(self):
        directory, digest, _ = self.snapshot()
        alias = self.root / 'snapshot-alias'
        alias.symlink_to(directory, target_is_directory=True)
        for name, extra in (
                ('alias-bundle', ('--snapshot-directory', str(alias), '--snapshot-sha', digest)),
                ('missing-digest', ('--snapshot-directory', str(directory))),
                ('missing-directory', ('--snapshot-sha', digest))):
            result = self.run_bundle(name, extra=extra)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse((self.root / name).exists())

    def test_installer_original_shell_preserves_index_and_rejects_snapshot_drift(self):
        repository = Path(__file__).resolve().parents[2]
        canonical = (repository / 'ci/github/workflows/install-mid.yml').read_text()
        for mirror in ('.github/workflows/install-mid.yml', 'workflow-patches/install-mid.yml'):
            self.assertEqual(canonical, (repository / mirror).read_text())
        step = canonical.split('        id: dist_recovery_shadow\n', 1)[1].split(
            '      - name: Snapshot-gebundenen dist-Recovery-Shadow', 1)[0]
        shadow = canonical.split('  dist_recovery_shadow:\n', 1)[1].split('  install_build:\n', 1)[0]
        self.assertIn('continue-on-error: true', shadow)
        self.assertIn('needs: [verify_core, verify_core_shards, verify_heavy]', shadow)
        self.assertNotIn('secrets.', shadow)
        self.assertNotIn('permission-contents: write', shadow)
        script = step.split('        run: |\n', 1)[1]
        script = '\n'.join(line.removeprefix('          ') for line in script.splitlines())
        self.assertLess(shadow.index('run: node tools/ci/release-snapshot.mjs restore /tmp/mid-snapshot'),
                        shadow.index('        id: dist_recovery_shadow'))
        tools = self.root / 'tools/ci'
        tools.mkdir(parents=True)
        for name in ('mid_740_stage_dist.py', 'mid_740_restore_dist.py',
                     'mid_740_installer_archive_shadow.py'):
            shutil.copyfile(repository / 'tools/ci' / name, tools / name)
        directory, digest, _ = self.snapshot()
        original_index = self.git('write-tree')
        with tempfile.TemporaryDirectory() as runner:
            env = {**os.environ, 'RUNNER_TEMP': runner,
                   'GITHUB_OUTPUT': str(Path(runner) / 'outputs'),
                   'GITHUB_RUN_ID': '123', 'GITHUB_RUN_ATTEMPT': '1',
                   'GITHUB_SHA': self.source, 'MID_RELEASE_VERSION': self.version,
                   'MID_BUILT_SNAPSHOT': str(directory), 'MID_SNAPSHOT_SHA': digest}
            result = subprocess.run(['bash', '-e'], input=script, text=True,
                                    cwd=self.root, env=env, capture_output=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(self.git('write-tree'), original_index)
            bundle = Path(runner) / 'mid740-installer-recovery-123-1'
            manifest = (bundle / MANIFEST).read_bytes()
            self.assertEqual(json.loads(manifest)['snapshotManifestSha256'], digest)
            self.assertEqual(list(Path(runner).glob('mid740-dist-index.*')), [])
            env['GITHUB_RUN_ATTEMPT'] = '2'
            env['MID_SNAPSHOT_SHA'] = '0' * 64
            rejected = subprocess.run(['bash', '-e'], input=script, text=True,
                                      cwd=self.root, env=env, capture_output=True, timeout=30)
            self.assertNotEqual(rejected.returncode, 0)
            self.assertFalse((Path(runner) / 'mid740-installer-recovery-123-2').exists())
            self.assertEqual((bundle / MANIFEST).read_bytes(), manifest)
            self.assertEqual(self.git('write-tree'), original_index)
            self.assertEqual(list(Path(runner).glob('mid740-dist-index.*')), [])


if __name__ == '__main__':
    unittest.main()
