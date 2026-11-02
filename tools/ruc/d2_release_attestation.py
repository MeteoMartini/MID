"""Verify cryptographically signed independent original DWD ICON-D2 index approval.

P0 security boundary: caller-supplied hashes and productionApproved are not
authorization. Only a SLSA attestation from a separately protected approval
workflow on the exact trusted main release SHA may authorize the index.
No trusted signer is implemented here, and no pilot may self-approve.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import subprocess

REPOSITORY = 'MeteoMartini/MID'
SIGNER_WORKFLOW = 'MeteoMartini/MID/.github/workflows/mid-d2-original-release-approval.yml'
PREDICATE = 'https://slsa.dev/provenance/v1'
SHA40 = re.compile(r'^[0-9a-f]{40}$')


def verify_signed_release_index(index_file: Path, source_commit_sha: str, *, runner=None) -> str:
    """Reverify signed subject bytes, trusted protected signer and exact source SHA.

    The protected release actor must independently recreate and attest the
    original 72-field, three-run DWD approval. This consumer MUST NOT create
    the attestation, accept a self-issued manifest, or honor an untrusted PR
    workflow. GitHub CLI performs certificate, Sigstore and transparency
    verification. A signed but wrong subject is rejected.
    """
    if not isinstance(source_commit_sha, str) or not SHA40.fullmatch(source_commit_sha):
        raise ValueError('Trusted protected release source commit absent')
    index = Path(index_file)
    if index.is_symlink() or not index.is_file():
        raise ValueError('Trusted original D2 index missing or symlinked')
    digest = hashlib.sha256(index.read_bytes()).hexdigest()
    command = [
        'gh', 'attestation', 'verify', str(index),
        '--repo', REPOSITORY, '--signer-workflow', SIGNER_WORKFLOW,
        '--source-ref', 'refs/heads/main',
        '--source-digest', source_commit_sha,
        '--predicate-type', PREDICATE,
        '--deny-self-hosted-runners', '--format', 'json',
    ]
    try:
        result = (runner or subprocess.run)(
            command, check=True, capture_output=True, text=True, timeout=60
        )
        proof = json.loads(result.stdout)
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired,
            TypeError, ValueError, json.JSONDecodeError) as exc:
        raise ValueError('Trusted D2 GitHub SLSA attestation absent or verification failed') from exc
    if not isinstance(proof, list) or not proof:
        raise ValueError('No signed original D2 release index attestation')
    # GitHub CLI verified certificate source identity and subject hash.
    # Inspect only the signed subject digest; never trust mutable predicates
    # to claim approval without the independent workflow identity above.
    if not any(
        isinstance(row, dict)
        and isinstance(row.get('verificationResult'), dict)
        and isinstance(row['verificationResult'].get('statement'), dict)
        and row['verificationResult']['statement'].get('predicateType') == PREDICATE
        and any(isinstance(subject, dict)
                and subject.get('digest', {}).get('sha256') == digest
                for subject in row['verificationResult']['statement'].get('subject', []))
        for row in proof
    ):
        raise ValueError('Signed native D2 release subject differs from exact source index')
    return digest
