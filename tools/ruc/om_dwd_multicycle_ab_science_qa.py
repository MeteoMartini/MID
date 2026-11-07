#!/usr/bin/env python3
"""Independent full-native-cell cross-run DWD RUC vs OM comparison (science only).

No production decoder/renderer, GPL reader bundled, worker changes or release.
Runs pinned to 2026-11-03 06Z / 07Z / 08Z; leads T+1h and T+6h.
All weather values paired with same original UTC run, lead and full native grid.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import math
from pathlib import Path
from tempfile import TemporaryDirectory

import numpy as np
from om_dwd_t2m_ab_science_qa import secure_download, NATIVE_CELLS

RUN_HOURS = (6, 7, 8)
LEADS = (1, 6)
RUN_DAY = dt.date(2026, 11, 3)
DATA_BASE = "https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/"
OM_BASE = "https://openmeteo.s3.amazonaws.com/data_spatial/dwd_icon_d2_ruc_native/"
# These are *study-specific* quantization tolerances, not a production
# meteorological plausibility or formal official-data quality threshold.
TOLERANCES = {"T_2M": 0.026, "VMAX_10M": 0.051}
VARIABLES = {
    "T_2M": ("temperature_2m", "K", "instant", "heightAboveGround", 2, 167),
    "VMAX_10M": ("wind_gusts_10m", "m s**-1", "max", "heightAboveGround", 10, 237318),
}


def run_time(hour):
    if type(hour) is not int or hour not in RUN_HOURS:
        raise ValueError("unapproved historical test cycle")
    return dt.datetime(RUN_DAY.year, RUN_DAY.month, RUN_DAY.day, hour, tzinfo=dt.timezone.utc)


def source_urls(run, lead, parameter):
    if parameter not in VARIABLES or lead not in LEADS or run.hour not in RUN_HOURS:
        raise ValueError("unapproved original-source combination")
    run_name=run.strftime("%Y-%m-%dT%H:%M")
    dwd=DATA_BASE+parameter+"/r/"+run_name+"/s/PT%03dH00M.grib2"%lead
    valid=run+dt.timedelta(hours=lead)
    om=OM_BASE+run.strftime("%Y/%m/%d/%H%MZ/")+valid.strftime("%Y-%m-%dT%H%M.om")
    return dwd,om,valid


def original_field(path, run, valid, lead, parameter):
    from eccodes import codes_grib_new_from_file, codes_get, codes_get_array, codes_release, codes_set
    variable, expected_unit, expected_kind, expected_level, level, param_id=VARIABLES[parameter]
    with open(path,"rb") as stream:
        gid=codes_grib_new_from_file(stream)
        if gid is None: raise ValueError("original DWD GRIB missing")
        try:
            codes_set(gid,"stepUnits",1)
            get=lambda key:codes_get(gid,key)
            meta={
                "referenceUtc": f'{int(get("dataDate")):08d}{int(get("dataTime")):04d}',
                "validUtc": f'{int(get("validityDate")):08d}{int(get("validityTime")):04d}',
                "gridType": str(get("gridType")),
                "units": str(get("units")),
                "stepType": str(get("stepType")),
                "startStep": int(get("startStep")),
                "endStep": int(get("endStep")),
                "paramId": int(get("paramId")),
                "typeOfLevel": str(get("typeOfLevel")),
                "level": int(get("level")),
                "pointCount": int(get("numberOfPoints")),
                "bitmapPresent": int(get("bitmapPresent")),
                "missingValue": float(get("missingValue")),
            }
            if (
                meta["referenceUtc"] != run.strftime("%Y%m%d%H%M")
                or meta["validUtc"] != valid.strftime("%Y%m%d%H%M")
                or meta["gridType"] != "unstructured_grid"
                or meta["pointCount"] != NATIVE_CELLS
                or meta["units"] != expected_unit
                or meta["stepType"] != expected_kind
                or meta["endStep"] != lead
                or meta["paramId"] != param_id
                or meta["typeOfLevel"] != expected_level
                or meta["level"] != level
                or (expected_kind=="max" and meta["startStep"]!=lead-1)
            ):
                raise ValueError("original DWD source-header mismatch: "+str(meta))
            raw=np.asarray(codes_get_array(gid,"values"),dtype=np.float64).reshape(-1)
            if raw.size != NATIVE_CELLS:raise ValueError("native DWD cell count drift")
            good=np.isfinite(raw)&(raw != meta["missingValue"])
            return raw,good,meta
        finally:
            codes_release(gid)


def om_values(root, parameter):
    var=VARIABLES[parameter][0]
    child=root.get_child_by_name(var)
    if not child.is_array or tuple(int(x) for x in child.shape)!=(1,NATIVE_CELLS):
        raise ValueError("OM array dimensions unsuitable for native cell comparison: "+var)
    values=np.asarray(child.read_array((...)),dtype=np.float64).reshape(-1)
    return values,np.isfinite(values)


def pair_metrics(dwd,dwd_good,processed,processed_good,parameter):
    if dwd.shape!=(NATIVE_CELLS,) or processed.shape!=(NATIVE_CELLS,):
        raise ValueError("native cell alignment failed")
    missing_mismatch=int(np.count_nonzero(dwd_good!=processed_good))
    if missing_mismatch:raise ValueError("original-vs-OM missing mask mismatch: "+str(missing_mismatch))
    paired=dwd_good&processed_good
    if paired.sum() < NATIVE_CELLS//2:raise ValueError("insufficient paired valid native cells")
    native=dwd[paired]-(273.15 if parameter=="T_2M" else 0)
    mapped=processed[paired]
    delta=np.abs(native-mapped)
    if not np.isfinite(delta).all():raise ValueError("non-finite valid data differences")
    max_error=float(delta.max())
    within_tolerance=max_error<=TOLERANCES[parameter]
    return {
        "paired": int(paired.sum()), "dwdMissing":int((~dwd_good).sum()),
        "omMissing":int((~processed_good).sum()),"missingMismatch":missing_mismatch,
        "dwdMin":float(native.min()),"dwdMax":float(native.max()),
        "omMin":float(mapped.min()),"omMax":float(mapped.max()),
        "mae":float(delta.mean()),"p95Abs":float(np.quantile(delta,.95)),
        "p99Abs":float(np.quantile(delta,.99)),
        "maxAbs":max_error,"withinStudyQuantization":within_tolerance,
        "studyQuantizationTolerance":TOLERANCES[parameter],
        "gridCoordinatesIndependentlyProven":False,
        "originalValueBitExact":False,
        "productionEligible":False,
    }


def main():
    from omfiles import OmFileReader
    records=[]
    with TemporaryDirectory(prefix="mid-om-ruc-multicycle-") as folder:
        for hr in RUN_HOURS:
            run=run_time(hr)
            for lead in LEADS:
                urls={p:source_urls(run,lead,p) for p in VARIABLES}
                _,om_url,valid=urls["T_2M"]
                file_om=Path(folder)/f"om-{hr}-{lead}.om"
                om_origin=secure_download(om_url,file_om,"om")
                with OmFileReader(str(file_om)) as root:
                    if not root.is_group:raise ValueError("OM spatial object is not group")
                    for param in VARIABLES:
                        dwd_url,check_url,check_valid=urls[param]
                        if check_url!=om_url or check_valid!=valid:
                            raise ValueError("cross-run/lead spatial object mismatch")
                        file_dwd=Path(folder)/f"original-{hr}-{lead}-{param}.grib2"
                        dwd_origin=secure_download(dwd_url,file_dwd,"dwd")
                        raw,good,header=original_field(file_dwd,run,valid,lead,param)
                        transformed,transformed_good=om_values(root,param)
                        record=pair_metrics(raw,good,transformed,transformed_good,param)
                        records.append({
                            "run":run.isoformat(),"leadHours":lead,"valid":valid.isoformat(),
                            "parameter":param,"dwdOriginalHeader":header,
                            "dwdOriginalSource":dwd_origin,
                            "omFullObjectSha256":om_origin["sha256"],
                            "omFullObjectBytes":om_origin["bytes"],
                            **record
                        })
    if len(records)!=len(RUN_HOURS)*len(LEADS)*len(VARIABLES):
        raise ValueError("incomplete cross-run matrix")
    failed=[{"run":v["run"],"lead":v["leadHours"],"parameter":v["parameter"],
             "mae":v["mae"],"maxAbs":v["maxAbs"]}
            for v in records if not v["withinStudyQuantization"]]
    report={
        "schema":"mid.ruc.dwd-om.native-multi-cycle-ab.shadow.v1",
        "observedAt":dt.datetime.now(dt.timezone.utc).isoformat(),
        "modelRuns":[run_time(h).isoformat() for h in RUN_HOURS],
        "leadsHours":list(LEADS),
        "fields":list(VARIABLES),
        "expectedComparisons":12,"completedComparisons":len(records),
        "quantizationExceptions":failed,
        "records":records,
        "allSourceRunAndIntervalHeadersValidated":True,
        "allDwdCoordinatesComparedToOm":False,
        "eps20AndNativeRapid5mProven":False,
        "productionEligible":False
    }
    print(json.dumps(report,indent=2,allow_nan=False))
    if failed:raise ValueError("some runs exceed observed study quantization envelope")


if __name__=="__main__":
    main()
