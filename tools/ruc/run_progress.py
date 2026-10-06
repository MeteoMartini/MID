"""Report the actual RUC candidate/result without changing scheduling or publication."""
import datetime as dt
import os
from pathlib import Path

def report_run(status, run):
    try:
        stamp = dt.datetime.fromisoformat(run.rstrip('/').replace('Z', '+00:00'))
        if stamp.tzinfo is None:
            stamp = stamp.replace(tzinfo=dt.timezone.utc)
        stamp = stamp.astimezone(dt.timezone.utc)
        line = f"RUC · {status}: {stamp:%Y-%m-%d} · {stamp:%H%M}Z ({run})"
    except (TypeError, ValueError, AttributeError):
        line = f"RUC · {status}: Laufkennung nicht bestimmbar"
    print(line, flush=True)
    summary = os.getenv('GITHUB_STEP_SUMMARY')
    if summary:
        with Path(summary).open('a', encoding='utf-8') as target:
            target.write(line + '\n\n')
    return line
