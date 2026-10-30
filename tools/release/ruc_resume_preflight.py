"""Conservative SHA-bound pre-dispatch compatibility check for RUC reuse.

This check only rejects candidates. The unchanged prepared_snapshot.admit
remains the authoritative complete contract, bytes, freshness and provenance gate.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

SHA = re.compile(r'^[a-f0-9]{40}$')
VERSION_WORKER = 'worker-src/00-core-observations.js'
VERSION_LOCK = 'package-lock.json'
FIXED_PATHS = {
    'src/forecastFusion.ts',
    'ci/github/workflows/mid-ruc-preprocess.yml',
    'MID_DWD_RUC_PIPELINE_CONTRACT.md',
}


def contract_path(name):
    path = Path(name)
    if name in FIXED_PATHS or name in (VERSION_WORKER, VERSION_LOCK):
        return True
    if path.parent == Path('tools/ruc') and (path.suffix in ('.py', '.mjs') or (path.name.startswith('requirements') and path.suffix == '.txt')):
        return True
    if path.parent == Path('worker-src') and path.suffix == '.js':
        return True
    return path.parent == Path('src') and re.fullmatch(r'ruc.*\.ts', path.name) is not None


def normalized_mirror(name, data):
    if name == VERSION_WORKER:
        new, n = re.subn(rb"const WORKER_VERSION='[^']+';", b"const WORKER_VERSION='__RELEASE__';", data)
        if n != 1:
            raise ValueError('ambiguous worker version marker')
        return new
    if name == VERSION_LOCK:
        value = json.loads(data)
        if not isinstance(value, dict) or not isinstance(value.get('packages'), dict) or not isinstance(value['packages'].get(''), dict):
            raise ValueError('invalid lockfile shape')
        value.pop('version', None)
        value['packages'][''].pop('version', None)
        return (json.dumps(value, sort_keys=True, separators=(',', ':')) + '\n').encode()
    raise ValueError('unknown version-normalized file')


def git(args, repo):
    return subprocess.run(['git', *args], cwd=repo, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE).stdout


def compatible_producer_source(producer_sha, *, repo=Path('.')):
    """Reject old code contracts before triggering a doomed immutable readmission.

    Missing Git objects, untrusted commits, ambiguous bytes and network issues
    never authorize reuse. Full normal calculation remains the safe fallback.
    """
    if not isinstance(producer_sha, str) or not SHA.fullmatch(producer_sha):
        return False
    try:
        head = git(['rev-parse', 'HEAD'], repo).decode().strip()
        if not SHA.fullmatch(head):
            return False
        if head == producer_sha:
            return True
        if git(['rev-parse', '--is-shallow-repository'], repo).strip() == b'true':
            git(['fetch', '--no-tags', '--filter=blob:none', '--deepen=128', 'origin', 'mid-stable'], repo)
        try:
            git(['merge-base', '--is-ancestor', producer_sha, 'HEAD'], repo)
        except subprocess.CalledProcessError:
            return False
        changed = git(['diff', '--name-only', '--no-renames', '-z', producer_sha, 'HEAD'], repo).decode('utf-8').split('\0')
        for name in changed:
            if not name or not contract_path(name):
                continue
            if name not in (VERSION_WORKER, VERSION_LOCK):
                return False
            old_mode = git(['ls-tree', producer_sha, '--', name], repo).split(b' ', 1)[0]
            new_mode = git(['ls-tree', 'HEAD', '--', name], repo).split(b' ', 1)[0]
            if old_mode != b'100644' or new_mode != b'100644':
                return False
            old = git(['show', producer_sha + ':' + name], repo)
            new = git(['show', 'HEAD:' + name], repo)
            if normalized_mirror(name, old) != normalized_mirror(name, new):
                return False
        return True
    except (OSError, subprocess.CalledProcessError, ValueError, UnicodeError):
        print('RUC resume: producer compatibility unverified; normal calculation required.', file=sys.stderr)
        return False
