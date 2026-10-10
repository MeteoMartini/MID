#!/usr/bin/env python3
"""Bounded real DWD MU header evidence, not a values/QC/E2E benchmark."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import bz2
import hashlib
import json
from pathlib import Path
import subprocess

import eccodes
import numpy as np
from scientific_grib_contract_probe import fetch, inspect


def capture(run):
    reference=datetime.strptime(run,'%Y-%m-%dT%H:%M').replace(tzinfo=timezone.utc)
    rows=[{'parameter':param,'logicalField':name,'member':None,
           'url':f'https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/{param}/r/{run}/s/PT{lead:03d}H00M.grib2'}
          for param,name in [('CAPE_MU','cape_mu'),('CIN_MU','cin_mu')] for lead in [0,1]]
    records=[]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for row,raw in pool.map(fetch,rows):
            record=inspect(row,raw,reference)  # shared production header/time/grid/unit guards
            gid=eccodes.codes_new_from_message(bz2.decompress(raw) if raw.startswith(b'BZh') else raw)
            try:
                record['rawHeader']={k:eccodes.codes_get(gid,k) for k in ['shortName','typeOfLevel','level','stepType','startStep','endStep']}
                record['rawHeader'].update({k:eccodes.codes_get_long(gid,k) for k in ['discipline','parameterCategory','parameterNumber','typeOfFirstFixedSurface','scaleFactorOfFirstFixedSurface','scaledValueOfFirstFixedSurface','typeOfSecondFixedSurface','scaleFactorOfSecondFixedSurface','scaledValueOfSecondFixedSurface']})
            finally:eccodes.codes_release(gid)
            records.append(record)
    root=Path(__file__).resolve().parents[2]
    source_paths=['tools/ruc/scientific_mu_contract_probe.py','tools/ruc/scientific_grib_contract_probe.py','tools/ruc/grib_metadata.py','tools/ruc/build_ruc_bundle.py']
    return {'schema':'mid.optional-mu-grib-header-reference.v1','capturedAt':datetime.now(timezone.utc).isoformat(),
            'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),
            'sourceWorktreeStatus':subprocess.check_output(['git','status','--porcelain','--',*source_paths],cwd=root,text=True).splitlines(),
            'sourceHashes':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in source_paths},
            'run':run,'nativeEcCodes':eccodes.codes_get_api_version(),'numpy':np.__version__,
            'scope':'four real DWD MU-energy headers at +0/+1h, not full values/QC/E2E or all optional products',
            'rawInputsRetained':False,'records':records}


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run',required=True,help='UTC initialization YYYY-MM-DDTHH:MM')
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    args.output.write_text(json.dumps(capture(args.run),indent=2)+'\n')
