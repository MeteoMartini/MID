# MID Implementation 0.9.78.58

Hotfix für GitHub-Actions-Run #889 (`b432aff258e3a72e62006d639281e9143336d1a7`).

- Der TypeScript-/Vite-Produktionsbuild von 0.9.78.57 war erfolgreich; der Release-Abbruch entstand ausschließlich durch fünf veraltete Wetterprofil-Regressionsverträge.
- Die fünf Tests wurden auf den seit 0.9.78.55/56 verbindlichen appweiten Hazard-Pfad umgestellt: `ForecastCockpit` nutzt `weather.hazards(...)` und `HazardItem` statt eines separaten lokalen `summarizeDwdWarnings`-/`DwdWarningSample`-Adapters.
- Damit verwenden 24-h-Profil, Warnsektion und Hazard-Leisten denselben kanonischen, probabilistisch erweiterten MID-Hazardpfad einschließlich der neuen Zeitfenster.
- Die Produktionslogik wurde nicht auf den veralteten Testvertrag zurückgebaut.
- Keine funktionale Worker-Änderung.

Aktualisierte Regressionen:
- `scripts/test-cockpit-meteogram-pro-09180.mjs`
- `scripts/test-mid-original-dwd-weather-profile-09310.mjs`
- `scripts/test-mid-weather-profile-thermal-hazards-09321.mjs`
- `scripts/test-mid-weather-profile-ux-hazards-09326.mjs`
- `scripts/test-weather-profile-pressure-hazards-09656.mjs`
