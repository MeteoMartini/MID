# MID v0.9.74.0 – 24-h-Wolkenprofil: höhentypische Struktur, Intensität und Fading

## Ziel
Der Wolkenbereich des 24-h-Wetterprofils wird entsprechend dem abgestimmten Konzeptbild aufgewertet, ohne den kanonischen Forecast- oder RUC-Datenvertrag zu verändern. Gesamtbewölkung sowie hohe, mittlere und tiefe Bewölkung bleiben direkte 0..100-%-Werte des gemeinsamen `Hour`-/`ShortTermForecastPoint`-Pfads.

## Umsetzung
- Neue kompakte Zeile **Gesamtbewölkung** oberhalb der drei Höhenschichten.
- **H / hohe Wolken:** cirrusartige, faserige/wispy SVG-Strukturen.
- **M / mittelhohe Wolken:** altocumulus-/schichtartige, kleinere gerundete Wolkenfelder.
- **L / tiefe Wolken:** kräftigere cumulus-/stratocumulusartige Wolkenkörper mit breiter Basis.
- Die jeweilige 0..100-%-Bedeckung steuert sichtbar Breite, Anzahl/Dichte, vertikale Masse und Opazität der Wolkenstruktur. Null bzw. nahezu null bleibt optisch leer.
- Das bereits vorhandene Nachbarstunden-Fading wird auf **Gesamt + H/M/L** erweitert; linke/rechte Gradientstops werden aus aktuellem und benachbartem Stundenwert gebildet. Dadurch entstehen weichere Übergänge statt harter Stundenblöcke.
- Die bisher erwarteten `cloud-cell-frame`-/`cloud-cell`-Verträge bleiben als sehr dezente Lane-/Fading-Unterlage erhalten; die eigentliche Intensität wird nun zusätzlich an der Wolkenform selbst sichtbar.
- Rechte Randwerte und Einzeldaten zeigen jetzt **Gesamt / H / M / L**.
- Dark-/Light-Theme erhalten abgestufte, aber zurückhaltende Höhenfarben.

## Daten- und RUC-Vertrag
Keine neue Wetterquelle und keine Schattenfusion. `cloud`, `highCloud`, `midCloud`, `lowCloud` stammen unverändert aus der kanonischen MID-Kurzfristreihe. Der vorherige RUC-Pages-Free-Mitigation-Patch bleibt enthalten; diese UI-Erweiterung ändert weder die RUC-Publikationsgröße noch die Worker-RUC-Semantik.

## Regression
Neue Pflichtregression: `scripts/test-cloud-profile-structures-09740.mjs`. Sie prüft Gesamt + H/M/L, die drei höhentypischen Strukturklassen, prozentabhängige Dichte, Nachbarstunden-Fading sowie die versionssynchrone Baseline. Bestehende Wetterprofil-/Open-Meteo-Regressionen wurden nur dort aktualisiert, wo die Beschriftung nun ausdrücklich Gesamtbewölkung einschließt.

## Plattform
Gemeinsamer React/Vite-Fachkern für Browser/PWA/iOS. Kein iOS-Fork, keine neue native Capability, keine kostenpflichtige Infrastruktur.
