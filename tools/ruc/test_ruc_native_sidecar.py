"""No-network regressions for optional sub-builds and fatal native process exits."""
import json
import subprocess
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

from run_ruc_native_sidecar import run_stage, run_all_stages, STAGES


class SidecarTests(unittest.TestCase):
    def test_totals_unavailable_removes_partial_output(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            def fail(output):
                output.write_text('partial')
                raise RuntimeError('upstream cycle incomplete')
            with patch.dict(sys.modules, {'build_precipitation_totals': types.SimpleNamespace(build=fail)}):
                run_stage('totals', root)
            self.assertFalse((root / 'precipitation-totals.json').exists())

    def test_observed_source_failure_never_publishes_partial_radolan(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            def fail(output):
                output.write_text('partial')
                raise ValueError('incomplete 48h source window')
            with patch.dict(sys.modules, {'build_observed_precipitation': types.SimpleNamespace(build=fail)}):
                run_stage('observed', root)
            self.assertFalse((root / 'observed-precipitation.json').exists())

    def test_native_map_uses_verified_totals_and_omits_failed_sidecar(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            (root / 'precipitation-totals.json').write_text(json.dumps({'run': 'verified'}))
            def fail(output, totals):
                self.assertEqual(totals, {'run': 'verified'})
                output.mkdir()
                (output / 'partial.bin').write_bytes(b'partial')
                raise OSError('optional map upstream unavailable')
            with patch.dict(sys.modules, {'build_model_map_fields': types.SimpleNamespace(build=fail)}):
                run_stage('model-fields', root)
            self.assertFalse((root / 'model-fields').exists())

    def test_unexpected_failure_is_not_relabelled_optional(self):
        with tempfile.TemporaryDirectory() as td:
            with patch.dict(sys.modules, {'build_precipitation_totals': types.SimpleNamespace(build=lambda _: (_ for _ in ()).throw(AssertionError('integrity failure')))}):
                with self.assertRaisesRegex(AssertionError, 'integrity failure'):
                    run_stage('totals', Path(td))
            with self.assertRaises(ValueError):
                run_stage('unknown', Path(td))

    def test_parent_invokes_all_native_stages_in_order_with_fatal_check(self):
        source = Path('fixture')
        sidecar = Path('candidate-sidecar.py')
        with patch('run_ruc_native_sidecar.subprocess.run') as run:
            run_all_stages(source, sidecar_path=sidecar, python_executable='python3')
        self.assertEqual(run.call_count, len(STAGES))
        self.assertEqual(
            [entry.args[0][2] for entry in run.call_args_list], list(STAGES))
        for entry in run.call_args_list:
            self.assertEqual(entry.kwargs, {'check': True})
            self.assertEqual(entry.args[0][:2], ['python3', str(sidecar)])
            self.assertEqual(entry.args[0][-2:], ['--source', str(source)])

    def test_parent_child_sigabrt_is_fatal_and_stops_following_stages(self):
        # Raise the same CalledProcessError that check=True returns when a child
        # exits due to SIGABRT, *from the real parent helper*, not a mocked
        # standalone call to subprocess.run (which tests nothing about MID).
        invoked = []
        def simulated_call(command, **kwargs):
            invoked.append(command[2])
            self.assertIs(kwargs.get('check'), True)
            if command[2] == 'observed':
                raise subprocess.CalledProcessError(-6, command)
        with patch('run_ruc_native_sidecar.subprocess.run', side_effect=simulated_call):
            with self.assertRaises(subprocess.CalledProcessError) as error:
                run_all_stages(Path('fixture'), python_executable='python3')
        self.assertEqual(error.exception.returncode, -6)
        self.assertEqual(invoked, ['totals', 'observed'])

    def test_parent_child_sigsegv_is_fatal(self):
        with patch('run_ruc_native_sidecar.subprocess.run', side_effect=subprocess.CalledProcessError(-11, ['python3'])):
            with self.assertRaises(subprocess.CalledProcessError) as error:
                run_all_stages(Path('fixture'), python_executable='python3')
        self.assertEqual(error.exception.returncode, -11)

    def test_real_subprocess_exit_is_fatal_to_parent(self):
        with tempfile.TemporaryDirectory() as td:
            script = Path(td) / 'exit_after_read.py'
            script.write_text('import sys\nsys.exit(139)\n')
            with self.assertRaises(subprocess.CalledProcessError) as error:
                run_all_stages(Path(td), sidecar_path=script)
            self.assertEqual(error.exception.returncode, 139)


if __name__ == '__main__':
    unittest.main()
