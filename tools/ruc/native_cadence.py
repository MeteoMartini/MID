"""Canonical ICON-D2-RUC cadence contract used by MID preprocessing.

The values below are limited to fields MID currently consumes and are based on
DWD's ICON-D2-RUC model documentation / live Open Data layout.  They describe
native output cadence; they must never be inferred from interpolation.
"""

DWD_ICON_D2_RUC_DOC_URL = "https://www.dwd.de/SharedDocs/downloads/DE/modelldokumentationen/nwv/icon_d2/icon_d2_dbbeschr_aktuell.pdf"

NATIVE_CADENCE_SECONDS = {
    "TOT_PREC": 300,
    "CAPE_ML": 900,
    "CIN_ML": 900,
    "DBZ_CMAX": 900,
    "LPI": 900,
    "LPI_MAX": 900,
    "UH_MAX": 900,
    "UH_MAX_LOW": 900,
    "UH_MAX_MED": 900,
    "ECHOTOPinM": 900,
    "W_CTMAX": 900,
    "VORW_CTMAX": 900,
    "VIS": 900,
    "CEILING": 900,
    "CAPE_MU": 3600,
    "CIN_MU": 3600,
    "T_2M": 3600,
    "TD_2M": 3600,
    "RELHUM_2M": 3600,
    "PMSL": 3600,
    "U_10M": 3600,
    "V_10M": 3600,
    "VMAX_10M": 3600,
    "CLCT": 3600,
    "CLCL": 3600,
    "CLCM": 3600,
    "CLCH": 3600,
    "T_G": 3600,
}

RAPID_5M = tuple(name for name, seconds in NATIVE_CADENCE_SECONDS.items() if seconds == 300)
RAPID_15M = tuple(name for name, seconds in NATIVE_CADENCE_SECONDS.items() if seconds == 900)
HOURLY = tuple(name for name, seconds in NATIVE_CADENCE_SECONDS.items() if seconds == 3600)

def native_cadence_seconds(parameter: str, fallback: int | None = None) -> int | None:
    return NATIVE_CADENCE_SECONDS.get(str(parameter), fallback)

def is_native_at(parameter: str, seconds: int) -> bool:
    return native_cadence_seconds(parameter) == int(seconds)
