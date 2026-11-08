#!/usr/bin/env python3
"""Offline read-only test of EPS20 phase-timing instrumentation in source AST.

Executes the real production writer from this checkout against controlled
in-memory packer doubles; never downloads GRIB or publishes anything.
"""
from __future__ import annotations
import ast
import contextlib
import io
import json
from pathlib import Path
import tempfile
import time
import unittest
import warnings
import numpy as np

ROOT = Path(__file__).parent

def load_subject(member_pack, summarize, pack_summary, summary_fields=('precipitation_mean',)):
    source = ROOT / 'build_ruc_bundle.py'
    tree = ast.parse(source.read_text(encoding='utf-8'), filename=str(source))
    matching = [n for n in tree.body if isinstance(n, ast.FunctionDef)
                and n.name == 'write_eps_products']
    if len(matching) != 1:
        raise AssertionError('production EPS writer changed; requalify the timing contract')
    node = matching[0]
    if [a.arg for a in node.args.args] != ['interval', 'members_path', 'summary_path', 'chunk_points']:
        raise AssertionError('EPS production writer signature changed')
    namespace = {
        'time': time, 'json': json,
        'pack_eps_members': member_pack, 'eps_summary': summarize,
        'pack_cell_major': pack_summary,
        'EPS_SUMMARY_FIELDS': summary_fields,
    }
    exec(compile(ast.Module(body=[node], type_ignores=[]), str(source), 'exec'), namespace)
    return namespace['write_eps_products']


class RucEpsP3Timing(unittest.TestCase):
    def test_wire_bytes_and_missing_zero_unchanged(self):
        stages = []
        def members(block, scale):
            self.assertEqual(scale, .01)
            stages.append('members')
            return np.asarray(block, dtype='<f8').tobytes()
        def summary(block):
            stages.append('summary')
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', RuntimeWarning)
                return {'precipitation_mean': np.nanmean(block, axis=1)}
        def packed(fields, specs):
            stages.append('summary_pack')
            self.assertEqual(specs, ('precipitation_mean',))
            return np.asarray(fields['precipitation_mean'], dtype='<f8').tobytes()
        writer = load_subject(members, summary, packed)
        source = np.arange(28 * 20 * 5, dtype=np.float64).reshape(28, 20, 5)
        source[0, 0, 0] = 0.0
        source[:, :, 3] = np.nan
        expected_member = b''.join(
            np.asarray(source[:, :, i:i+2], dtype='<f8').tobytes()
            for i in range(0, 5, 2)
        )
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', RuntimeWarning)
            expected_summary = b''.join(
                np.asarray(np.nanmean(source[:, :, i:i+2], axis=1), dtype='<f8').tobytes()
                for i in range(0, 5, 2)
            )
        with tempfile.TemporaryDirectory() as td, contextlib.redirect_stdout(io.StringIO()) as stdout:
            member_path = Path(td) / 'members.bin'
            summary_path = Path(td) / 'summary.bin'
            writer(source, member_path, summary_path, 2)
            self.assertEqual(member_path.read_bytes(), expected_member)
            self.assertEqual(summary_path.read_bytes(), expected_summary)
            output = stdout.getvalue().splitlines()
        self.assertEqual(stages, ['members', 'summary', 'summary_pack'] * 3)
        timing = [line for line in output if line.startswith('RUC_P3_EPS_TIMINGS ')]
        self.assertEqual(len(timing), 1)
        report = json.loads(timing[0].split(' ', 1)[1])
        self.assertEqual(report['schema'], 'mid.ruc.p3-eps-timings.v1')
        self.assertEqual((report['chunks'], report['points'], report['validTimes'], report['members']),
                         (3, 5, 28, 20))
        for field in ('memberPackWriteSeconds', 'epsSummarySeconds', 'summaryPackWriteSeconds'):
            self.assertIsInstance(report[field], float)
            self.assertGreaterEqual(report[field], 0)
            self.assertLess(report[field], 60)
        self.assertEqual(float(source[0, 0, 0]), 0.0)
        self.assertTrue(np.isnan(source[:, :, 3]).all())

    def test_real_production_packer_bytes_against_uninstrumented_reference(self):
        """Exact production packer functions, original EPS summary, NoData and zero."""
        from ruc_pack import EPS_SUMMARY_FIELDS, pack_cell_major, pack_eps_members
        tree = ast.parse((ROOT / 'build_ruc_bundle.py').read_text(encoding='utf-8'))
        found = [node for node in tree.body if isinstance(node, ast.FunctionDef)
                 and node.name == 'eps_summary']
        self.assertEqual(len(found), 1)
        namespace = {'np': np}
        exec(compile(ast.Module(body=found, type_ignores=[]), 'build_ruc_bundle.py', 'exec'),
             namespace)
        original_summary = namespace['eps_summary']
        rng = np.random.default_rng(20261101)
        source = rng.gamma(1.8, 4, size=(28, 20, 17))
        source[:, :, 0] = np.nan
        source[:, 0, 1] = 0.0
        source[6, 14, 6] = np.inf
        chunks = [source[:, :, start:start+8] for start in range(0, 17, 8)]
        expected_members = b''.join(pack_eps_members(block, .01) for block in chunks)
        with warnings.catch_warnings():
            warnings.simplefilter('ignore', RuntimeWarning)
            expected_summary = b''.join(
                pack_cell_major(original_summary(block), EPS_SUMMARY_FIELDS)
                for block in chunks
            )
            writer = load_subject(pack_eps_members, original_summary, pack_cell_major, EPS_SUMMARY_FIELDS)
            with tempfile.TemporaryDirectory() as td, contextlib.redirect_stdout(io.StringIO()) as output:
                member_path = Path(td) / 'members.bin'
                summary_path = Path(td) / 'summary.bin'
                writer(source, member_path, summary_path, 8)
                self.assertEqual(member_path.read_bytes(), expected_members)
                self.assertEqual(summary_path.read_bytes(), expected_summary)
                timing = [line for line in output.getvalue().splitlines()
                          if line.startswith('RUC_P3_EPS_TIMINGS ')]
        self.assertEqual(len(timing), 1)
        self.assertEqual(json.loads(timing[0].split(' ', 1)[1])['chunks'], 3)
        self.assertTrue(np.isnan(source[:, :, 0]).all())
        self.assertEqual(float(source[0, 0, 1]), 0.0)

    def test_reject_invalid_chunk_without_files(self):
        writer = load_subject(lambda *a: b'', lambda *a: {}, lambda *a: b'')
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaisesRegex(ValueError, 'chunk_points must be positive'):
                writer(np.ones((2, 20, 3)), Path(td)/'m', Path(td)/'s', 0)
            self.assertFalse((Path(td)/'m').exists())
            self.assertFalse((Path(td)/'s').exists())


    def test_actual_writer_candidate_shadow_exact_full_binary(self):
        """Prospective one-call P3 substitution through actual production writer.

        Original AST is never edited on disk, no DWD download, deploy, or
        release. The already separately verified authentic GRIB A/B remains
        in #709. This exercises both full binary outputs of the true writer.
        """
        import copy
        import hashlib
        from ruc_pack import EPS_SUMMARY_FIELDS, pack_cell_major, pack_eps_members
        from ruc_p3_eps_quantile_candidate import candidate_eps_linear_quantiles

        script = ROOT / 'build_ruc_bundle.py'
        tree = ast.parse(script.read_text(encoding='utf-8'), filename=str(script))
        eps = [n for n in tree.body if isinstance(n, ast.FunctionDef)
               and n.name == 'eps_summary']
        self.assertEqual(len(eps), 1, 'production summary changed: requalify P3')
        self.assertEqual([a.arg for a in eps[0].args.args], ['interval'])
        experimental = copy.deepcopy(eps[0])
        targets = [n for n in ast.walk(experimental)
                   if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
                   and isinstance(n.func.value, ast.Name)
                   and n.func.value.id == 'np' and n.func.attr == 'nanquantile']
        self.assertEqual(len(targets), 1, 'one-to-one candidate insertion no longer safe')
        call = targets[0]
        self.assertEqual(len(call.args), 2)
        self.assertEqual(ast.unparse(call.args[0]), 'safe')
        self.assertEqual(ast.literal_eval(call.args[1]), (0.25, 0.5, 0.75))
        self.assertEqual(len(call.keywords), 1)
        self.assertEqual(call.keywords[0].arg, 'axis')
        self.assertEqual(ast.literal_eval(call.keywords[0].value), 1)
        call.func = ast.Name(id='candidate_eps_linear_quantiles', ctx=ast.Load())
        call.args = [call.args[0]]
        call.keywords = []
        ast.fix_missing_locations(experimental)

        def compile_summary(node, injected=False):
            space = {'np': np}
            if injected:
                space['candidate_eps_linear_quantiles'] = candidate_eps_linear_quantiles
            exec(compile(ast.Module(body=[node], type_ignores=[]), str(script), 'exec'), space)
            return space['eps_summary']

        reference = compile_summary(eps[0])
        shadow = compile_summary(experimental, injected=True)
        original_writer = load_subject(pack_eps_members, reference,
                                       pack_cell_major, EPS_SUMMARY_FIELDS)
        shadow_writer = load_subject(pack_eps_members, shadow,
                                     pack_cell_major, EPS_SUMMARY_FIELDS)
        points = 4096 + 37  # real full production chunk plus non-full tail
        cube = np.random.default_rng(20261108).gamma(
            1.8, 3.1, size=(28, 20, points)).astype(np.float64)
        cube[:, :, 0:2] = np.nan
        cube[:, :, 2] = 0.0
        cube[:, 0, 3] = 0.0
        cube[11, 17, 4] = np.inf
        cube[12, 9, 5] = -np.inf
        cube[20, 4, 6] = 1e10  # preserve physical extremes before int16 clipping
        cube[23, 13, 12] = np.nan
        cube[27, 2, 4096] = 0.0
        before = hashlib.sha256(cube.tobytes()).hexdigest()
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            ref_members, ref_summary = root/'ref-members.bin', root/'ref-summary.bin'
            fast_members, fast_summary = root/'fast-members.bin', root/'fast-summary.bin'
            stdout = []
            for writer, members, summary in (
                (original_writer, ref_members, ref_summary),
                (shadow_writer, fast_members, fast_summary),
            ):
                with warnings.catch_warnings(), contextlib.redirect_stdout(io.StringIO()) as out:
                    warnings.simplefilter('ignore', RuntimeWarning)
                    writer(cube, members, summary, chunk_points=4096)
                timing = [line for line in out.getvalue().splitlines()
                          if line.startswith('RUC_P3_EPS_TIMINGS ')]
                self.assertEqual(len(timing), 1)
                evidence = json.loads(timing[0].split(' ', 1)[1])
                self.assertEqual((evidence['chunks'], evidence['points'],
                                  evidence['validTimes'], evidence['members']),
                                 (2, points, 28, 20))
                stdout.append(evidence)
            ref_bm = ref_members.read_bytes()
            ref_bs = ref_summary.read_bytes()
            self.assertEqual(hashlib.sha256(ref_bm).digest(),
                             hashlib.sha256(fast_members.read_bytes()).digest())
            self.assertEqual(hashlib.sha256(ref_bs).digest(),
                             hashlib.sha256(fast_summary.read_bytes()).digest())
            self.assertEqual(ref_bm, fast_members.read_bytes())
            self.assertEqual(ref_bs, fast_summary.read_bytes())
            self.assertEqual(len(ref_bm), points * 28 * 20 * 2)
            self.assertEqual(len(ref_bs), points * 28 * len(EPS_SUMMARY_FIELDS) * 2)
            member_data = np.frombuffer(ref_bm, dtype='<u2').reshape(points, 28, 20)
            summary_data = np.frombuffer(ref_bs, dtype='<i2').reshape(
                points, 28, len(EPS_SUMMARY_FIELDS))
            self.assertTrue(np.all(member_data[0] == 65535))
            self.assertTrue(np.all(summary_data[0] == -32768))
            self.assertTrue(np.all(member_data[2] == 0))
            self.assertTrue(np.all(summary_data[2] == 0))
            self.assertTrue(np.any(summary_data[6] != -32768))
        self.assertEqual(hashlib.sha256(cube.tobytes()).hexdigest(), before)
        self.assertEqual(len(stdout), 2)


    def test_native_shape_bounded_memory_133_chunks_without_original_download(self):
        """Synthetic full 542040-grid stress; no claim of native GRIB E2E or SLO.

        Feed exactly the production 28xEPS20/4096 geometry but do not allocate
        a 2.4 GiB full-grid source or retain binary outputs in memory. This
        bounds only incremental quantile/packer RSS, not the full GRIB decoder
        or production whole-process RSS. Four chunks are byte-matched against
        the unmodified production AST, including the final partial chunk.
        """
        import hashlib
        import resource
        from ruc_pack import EPS_SUMMARY_FIELDS, pack_cell_major, pack_eps_members
        from ruc_p3_eps_quantile_candidate import candidate_eps_linear_quantiles

        tree = ast.parse((ROOT / 'build_ruc_bundle.py').read_text(encoding='utf-8'))
        functions = [n for n in tree.body if isinstance(n, ast.FunctionDef)
                     and n.name == 'eps_summary']
        self.assertEqual(len(functions), 1, 'production reference moved: requalify')
        namespace = {'np': np}
        exec(compile(ast.Module(body=functions, type_ignores=[]),
                     'build_ruc_bundle.py', 'exec'), namespace)
        original = namespace['eps_summary']

        total_points, chunk_points, valid_times, members = 542040, 4096, 28, 20
        rng = np.random.default_rng(2026110819)
        member_sha, summary_sha = hashlib.sha256(), hashlib.sha256()
        member_bytes = summary_bytes = 0
        reference_checked = 0
        started = time.perf_counter()
        for chunk_index, start in enumerate(range(0, total_points, chunk_points)):
            width = min(chunk_points, total_points - start)
            cube = rng.gamma(1.9, 2.8, size=(valid_times, members, width))
            cube[:, :, 0] = np.nan  # all member data missing: never dry
            cube[:, :, 1] = 0.0    # genuinely dry: must be zero
            cube[0, 0, 2] = np.inf
            cube[1, 1, 2] = -np.inf
            cube[2, 2, 2] = 1e10  # retain extreme before normal int16 clip
            cube[3, :10, 3] = np.nan
            cube[4, 7:, 4] = np.nan
            cube[5, 0, 5] = .005
            cube[5, 1, 5] = .015

            # Reproduce the unchanged production mean and probability contract.
            valid = np.isfinite(cube)
            safe = np.where(valid, cube, np.nan)
            count = np.sum(valid, axis=1)
            with warnings.catch_warnings():
                warnings.simplefilter('ignore', RuntimeWarning)
                mean = np.nanmean(safe, axis=1)
                quantiles = candidate_eps_linear_quantiles(safe)
            denom = np.maximum(count, 1)
            optimized = {
                'precipitation_probability': np.where(
                    count > 0, 100 * np.sum(valid & (cube > .2), axis=1) / denom, np.nan),
                'precipitation_probability_significant': np.where(
                    count > 0, 100 * np.sum(valid & (cube > 5.0), axis=1) / denom, np.nan),
                'precipitation_mean': mean,
                'precipitation_q25': quantiles[0],
                'precipitation_q50': quantiles[1],
                'precipitation_q75': quantiles[2],
            }
            member_wire = pack_eps_members(cube, .01)
            summary_wire = pack_cell_major(optimized, EPS_SUMMARY_FIELDS)
            member_sha.update(member_wire)
            summary_sha.update(summary_wire)
            member_bytes += len(member_wire)
            summary_bytes += len(summary_wire)
            self.assertEqual(len(member_wire), width * valid_times * members * 2)
            self.assertEqual(len(summary_wire),
                             width * valid_times * len(EPS_SUMMARY_FIELDS) * 2)
            member_view = np.frombuffer(member_wire, dtype='<u2').reshape(
                width, valid_times, members)
            summary_view = np.frombuffer(summary_wire, dtype='<i2').reshape(
                width, valid_times, len(EPS_SUMMARY_FIELDS))
            self.assertTrue(np.all(member_view[0] == 65535))
            self.assertTrue(np.all(summary_view[0] == -32768))
            self.assertTrue(np.all(member_view[1] == 0))
            self.assertTrue(np.all(summary_view[1] == 0))
            if chunk_index in (0, 1, 65, 132):
                with warnings.catch_warnings():
                    warnings.simplefilter('ignore', RuntimeWarning)
                    genuine_reference = original(cube)
                self.assertEqual(summary_wire,
                                 pack_cell_major(genuine_reference, EPS_SUMMARY_FIELDS))
                reference_checked += 1
            del cube, valid, safe, count, mean, quantiles, optimized
            del member_wire, summary_wire, member_view, summary_view

        n_chunks = (total_points + chunk_points - 1) // chunk_points
        elapsed = time.perf_counter() - started
        peak_mib = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024
        self.assertEqual(n_chunks, 133)
        self.assertEqual(reference_checked, 4)
        self.assertEqual(member_bytes, total_points * valid_times * members * 2)
        self.assertEqual(summary_bytes, total_points * valid_times *
                         len(EPS_SUMMARY_FIELDS) * 2)
        self.assertLess(peak_mib, 1024.0,
                        'incremental EPS quantile+packing process RSS >= 1 GiB')
        evidence = {
            'schema': 'mid.ruc.p3-synthetic-chunk-memory.v1',
            'realDwdGribDownloaded': False,
            'fullPipelinePeakRamVerified': False,
            'productionSpeedupVerified': False,
            'points': total_points, 'times': valid_times, 'members': members,
            'chunks': n_chunks, 'byteMatchedReferenceChunks': reference_checked,
            'memberBytesHashed': member_bytes,
            'summaryBytesHashed': summary_bytes,
            'memberDigest': member_sha.hexdigest(),
            'summaryDigest': summary_sha.hexdigest(),
            'incrementalProcessPeakRssMiB': round(peak_mib, 2),
            'syntheticCpuWallSeconds': round(elapsed, 3),
        }
        print('RUC_P3_SYNTHETIC_MEMORY_QA ' +
              json.dumps(evidence, sort_keys=True), flush=True)


if __name__ == '__main__':
    unittest.main()
