#!/usr/bin/env python3
"""Run one optional, native-library-heavy RUC sidecar in an isolated process.

ecCodes followed by pyproj in one interpreter can abort during native teardown.
Keep their imports in separate interpreters; changing import order is not a fix.
A signal/nonzero interpreter exit is fatal to the calling workflow. Only the
same expected data-unavailability exceptions as the legacy in-process builder
are optional. The complete RUC core, checks and publication gates are unchanged.
"""
from __future__ import annotations
import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

STAGES = ('totals', 'observed', 'model-fields', 'synoptic')


def run_all_stages(source: Path, *, sidecar_path: Path | None = None, python_executable: str | None = None) -> None:
    """Run the actual subprocess call chain; every native crash is fatal.

    This is intentionally outside the native builder so that the parent
    inventory/packing process never imports ecCodes, h5py or pyproj from these
    optional native products. A failed child cannot be relabelled optional.
    """
    program = str(python_executable or sys.executable)
    sidecar = str(sidecar_path or Path(__file__).resolve())
    for stage in STAGES:
        print(f'RUC native subprocess starting: {stage}', flush=True)
        subprocess.run([program, sidecar, stage, '--source', str(source)], check=True)
        print(f'RUC native subprocess completed: {stage}', flush=True)


def run_stage(stage: str, source: Path) -> None:
    if stage not in STAGES:
        raise ValueError('unknown native RUC stage')
    source = Path(source)
    if stage == 'totals':
        from build_precipitation_totals import build
        output = source / 'precipitation-totals.json'
        output.unlink(missing_ok=True)
        try:
            build(output)
        except RuntimeError as error:
            output.unlink(missing_ok=True)
            print(f'::warning::ICON-D2 totals unavailable: {error}', flush=True)
    elif stage == 'observed':
        from build_observed_precipitation import build
        output = source / 'observed-precipitation.json'
        output.unlink(missing_ok=True)
        try:
            build(output)
        except (RuntimeError, ValueError, OSError) as error:
            output.unlink(missing_ok=True)
            print(f'::warning::RADOLAN sums unavailable: {error}', flush=True)
    elif stage == 'model-fields':
        from build_model_map_fields import build
        output = source / 'model-fields'
        if output.exists():
            shutil.rmtree(output)
        totals_path = source / 'precipitation-totals.json'
        if totals_path.is_file():
            try:
                build(output, json.loads(totals_path.read_text(encoding='utf-8')))
            except (RuntimeError, ValueError, OSError) as error:
                shutil.rmtree(output, ignore_errors=True)
                print(f'::warning::ICON-D2 native maps unavailable: {error}', flush=True)
    else:
        from build_synoptic_fields import build
        output = source / 'synoptic-fields'
        if output.exists():
            shutil.rmtree(output)
        try:
            build(output)
        except Exception as error:
            shutil.rmtree(output, ignore_errors=True)
            print(f'::warning::Synoptic fields unavailable: {error}', flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('stage', choices=STAGES)
    parser.add_argument('--source', type=Path, required=True)
    args = parser.parse_args()
    print(f'RUC native sidecar: {args.stage}', flush=True)
    run_stage(args.stage, args.source)


if __name__ == '__main__':
    main()
