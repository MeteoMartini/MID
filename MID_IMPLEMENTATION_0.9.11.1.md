# MID v0.9.11.1

## Buildfix

Der App-Zustand `radarAnalysis` kann `RadarNowcast | null` sein. Die neuen Kurzfrist- und Cockpit-Props akzeptieren `RadarNowcast | undefined`. Alle drei Übergaben normalisieren `null` nun explizit mit `radarAnalysis ?? undefined`.

Die meteorologische und visuelle Funktionalität von v0.9.11.0 bleibt unverändert.
