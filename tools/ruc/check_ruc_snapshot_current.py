"""Prevent a prebuilt MID release artifact from rolling back the RUC pointer."""
import argparse
import os
import urllib.parse
from pathlib import Path
from check_ruc_health import fetch_payload, probe_url


def snapshot_current(base, expected, fetcher=fetch_payload):
    meta = fetcher(probe_url(urllib.parse.urljoin(base.rstrip('/')+'/', 'latest.json'), expected, 1), 15)
    if meta.get('schema') != 'mid.dwd.ruc.grid.v2' or meta.get('storageProfile') != 'pages-free-v1':
        raise RuntimeError('Current public RUC metadata is invalid')
    return bool(expected) and meta.get('run') == expected


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--base', required=True)
    p.add_argument('--expected', default='')
    p.add_argument('--enabled', default='false')
    a = p.parse_args()
    try:
        current = a.enabled != 'true' or snapshot_current(a.base, a.expected)
    except Exception as error:
        print(f'RUC snapshot verification failed; rebuild required: {error}')
        current = False
    output = os.getenv('GITHUB_OUTPUT')
    if output:
        with Path(output).open('a') as stream:
            stream.write(f'current={str(current).lower()}\nrun={a.expected}\n')
    print('RUC release snapshot: '+('current' if current else 'refresh required under Pages lock'))


if __name__ == '__main__':
    main()
