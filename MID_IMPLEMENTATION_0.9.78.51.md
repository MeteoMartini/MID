# MID Implementation 0.9.78.51

## Knoten-Anzeigevertrag

Der Nutzervertrag ist jetzt eindeutig: **sichtbar nur `kt`**, außer innerhalb eines unveränderten amtlichen Originalwarntexts.

### Umsetzung
- Der interne MID-Windschlüssel bleibt aus Kompatibilitätsgründen `kn`, weil Open-Meteo diesen API-Wert erwartet und bestehende Datenpfade darauf basieren.
- Sämtliche MID-Formatter behandeln diesen internen Schlüssel weiterhin als Knoten, geben ihn aber sichtbar als `kt` aus.
- Die Einheitenauswahl zeigt `kt / Knoten` und niemals `kn`.
- Die kompakte MID-Zeile oberhalb eines amtlichen Windwarntexts übernimmt direkte offizielle Knotenwerte (`kn`, `kt`, `Knoten`) numerisch und zeigt sie als `kt`.
- Der amtliche Beschreibungstext und die amtlichen Handlungshinweise werden nicht verändert. Dort bleibt ein von der Quelle geliefertes `kn` erhalten.
- `MID_WARNING_HYBRID_CONTRACT.md` ist auf v0.9.78.51 aktualisiert.

## Regression
- `scripts/test-wind-kt-display-contract-097851.mjs`
