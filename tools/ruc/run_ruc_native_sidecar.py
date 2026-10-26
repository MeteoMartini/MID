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
import time
import os
from datetime import datetime,timezone
from pathlib import Path

STAGES = ('totals', 'observed', 'model-fields', 'synoptic')


def emit_timing(row):
    row={'at':datetime.now(timezone.utc).isoformat(),**row}
    print('RUC_TIMING '+json.dumps(row),flush=True)
    if os.environ.get('MID_RUC_TIMINGS_FILE'):
        with open(os.environ['MID_RUC_TIMINGS_FILE'],'a') as stream:stream.write(json.dumps(row)+'\n')


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
        started=time.monotonic();code=None
        emit_timing({'stage':'native/'+stage,'event':'start'})
        try:
            subprocess.run([program, sidecar, stage, '--source', str(source)], check=True)
            code=0
        except subprocess.CalledProcessError as error:
            code=error.returncode
            raise
        finally:
            row={'stage':'native/'+stage,'event':'finish','elapsedSeconds':round(time.monotonic()-started,3),'exitCode':code,'signal':-code if type(code) is int and code<0 else None,'reason':'success' if code==0 else 'signal' if type(code) is int and code<0 else 'nonzero-or-interrupted'}
            emit_timing(row)
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
