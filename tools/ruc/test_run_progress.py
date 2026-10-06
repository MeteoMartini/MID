import os
import tempfile
from pathlib import Path
from unittest.mock import patch
from run_progress import report_run
with tempfile.TemporaryDirectory() as directory:
    summary=Path(directory)/'summary.md'
    with patch.dict(os.environ, {'GITHUB_STEP_SUMMARY':str(summary)}):
        assert '2026-10-06 · 0900Z' in report_run('wird geprüft', '2026-10-06T09:00')
        assert '0900Z' in report_run('vollständig aufbereitet · noch nicht veröffentlicht', '2026-10-06T11:00+02:00')
    text=summary.read_text()
    assert text.count('0900Z')==2 and 'noch nicht veröffentlicht' in text
assert 'nicht bestimmbar' in report_run('Metadaten', 'invalid')
print('RUC run progress: actual date/cycle, UTC conversion and summary verified')
