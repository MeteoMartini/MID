#!/usr/bin/env python3
"""Read-only native ICON-D2-RUC coordinate consistency across multiple DWD runs.

This checks original DWD CLAT/CLON GRIB values, units and *index ordering*
across three original coordinate runs. It does not establish OM's independent
coordinate association, any weather field values or a production admission.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib
import json
import numpy as np

from om_dwd_t2m_ab_science_qa import secure_download, NATIVE_CELLS

RUN_IDS = ("2026-11-03T06:00", "2026-11-03T07:00", "2026-11-03T08:00")
PARAMS = ("CLAT", "CLON")
DWD_ROOT = "https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/"


def decode_native_grid_coordinate(file, parameter):
    from eccodes import codes_grib_new_from_file, codes_get, codes_get_array, codes_release
    with open(file,"rb") as stream:
        gid = codes_grib_new_from_file(stream)
        if gid is None:raise ValueError("empty original native coordinate GRIB")
        try:
            get=lambda key:codes_get(gid,key)
            meta={
                "parameter":parameter,
                "gridType":str(get("gridType")),
                "units":str(get("units")),
                "points":int(get("numberOfPoints")),
                "date":int(get("dataDate")),
                "time":int(get("dataTime")),
                "shortName":str(get("shortName")),
                "missingValue":float(get("missingValue")),
                "bitmapPresent":int(get("bitmapPresent")),
            }
            if meta["points"]!=NATIVE_CELLS or meta["gridType"]!="unstructured_grid":
                raise ValueError("incorrect coordinate source grid: "+str(meta))
            values=np.asarray(codes_get_array(gid,"values"),dtype=np.float64).reshape(-1)
            if values.size!=NATIVE_CELLS or not np.isfinite(values).all() or np.any(values==meta["missingValue"]):
                raise ValueError("coordinate GRIB contains missing values or wrong native count")
            units=meta["units"].lower().strip()
            if units in ("rad","radian","radians"):
                degrees=np.rad2deg(values)
                transformedUnits="degrees from radians"
            elif parameter=="CLAT" and units in ("degree n","degrees_north"):
                degrees=values
                transformedUnits="degrees_north"
            elif parameter=="CLON" and units in ("degree e","degrees_east"):
                degrees=values
                transformedUnits="degrees_east"
            else:
                raise ValueError("unsupported native coordinate unit "+parameter+": "+repr(units))
            if parameter=="CLAT" and (float(degrees.min())<-90 or float(degrees.max())>90):
                raise ValueError("invalid latitude")
            if parameter=="CLON" and (float(degrees.min())<-180 or float(degrees.max())>180):
                raise ValueError("invalid longitude")
            return degrees, {**meta,"normalizedUnits":transformedUnits,
                             "minDegrees":float(degrees.min()),"maxDegrees":float(degrees.max())}
        finally:
            codes_release(gid)


def main():
    rows=[]
    reference=None
    with TemporaryDirectory(prefix="mid-ruc-original-grid-") as folder:
        for run in RUN_IDS:
            pair={}
            for parameter in PARAMS:
                url=DWD_ROOT+parameter+"/r/"+run+"/s/PT000H00M.grib2"
                path=Path(folder)/(parameter+"-"+run.replace(":","")+".grib2")
                origin=secure_download(url,path,"dwd")
                values,meta=decode_native_grid_coordinate(path,parameter)
                expected_timestamp=run.replace("-","").replace(":","").replace("T","")
                actual_timestamp=f'{meta["date"]:08d}{meta["time"]:04d}'
                # Coordinate fields may be static; strict original values and per-file
                # lineage matter even when DWD uses static initialization metadata.
                pair[parameter]=values
                rows.append({
                    "DwdRunDirectory":run,"parameter":parameter,"source":origin,
                    "gribMetadata":meta,
                    "headerRunMatchesDirectory": actual_timestamp==expected_timestamp,
                    "coordinateValueSha256":hashlib.sha256(values.astype("<f8").tobytes()).hexdigest(),
                    "coordinateCount":values.size
                })
            if reference is None:
                reference=pair
            else:
                for parameter in PARAMS:
                    if not np.array_equal(reference[parameter],pair[parameter]):
                        delta=np.max(np.abs(reference[parameter]-pair[parameter]))
                        raise ValueError(f"native original {parameter} cell ordering drift, max diff {delta}")
    if len(rows)!=6:raise ValueError("incomplete original native-grid coordinate inventory")
    report={
        "schema":"mid.ruc.original-native-grid-cross-run.shadow.v1",
        "observedAt":datetime.now(timezone.utc).isoformat(),
        "sourceRuns":list(RUN_IDS),"nativeCells":NATIVE_CELLS,
        "originalGridCoordinateIndexConsistentAcrossThreeRuns":True,
        "coordinates":[{"parameter":p,
             "min":float(reference[p].min()),"max":float(reference[p].max()),
             "sha256":hashlib.sha256(reference[p].astype("<f8").tobytes()).hexdigest()}
             for p in PARAMS],
        "rows":rows,
        "processedOmIndexCoordinatesIndependentlyProven":False,
        "DwdOriginalGridSuitableForExistingMidNativeMap":True,
        "productionEligible":False
    }
    print(json.dumps(report,indent=2,allow_nan=False))


if __name__=="__main__":
    main()
