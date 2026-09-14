# MID v0.9.84.100 – Implementierungsbericht

## Ausgangslage

Der Release-Kandidat v0.9.84.99 wurde durch den GitHub-Installer **#1054** (Run `34841143619`, Commit `4812db00dd607d1ed64a2f1ffb66156698bd6595`) korrekt entpackt, reproduzierbar installiert und sicherheitsseitig geprüft. Der Lauf stoppte ausschließlich im TypeScript-Gate mit zwei `TS6133`-Fehlern in `src/RadarPanel.tsx`:

- `MemoCompositeFronts` war nach der Synoptik-Bereinigung nicht mehr im Renderpfad verwendet.
- `SynopticFrontCanvasFallback` war ebenfalls nur noch als tote Altimplementierung vorhanden.

Der letzte erfolgreich veröffentlichte kanonische Stand bleibt bis zu einem erfolgreichen neuen Installer **v0.9.84.98** auf `mid-stable` (Commit `e90ac3e0210ddda50249b92787a1ab050bc2e1a2`). v0.9.84.100 setzt den fachlichen Kandidaten v0.9.84.99 fort und verwirft dessen beabsichtigte Änderungen nicht.

## Korrektur

Die beiden verwaisten Front-Renderer wurden vollständig aus `RadarPanel.tsx` entfernt, statt TypeScript-Prüfungen abzuschwächen oder die Komponenten künstlich zu referenzieren. Der aktive Frontpfad bleibt `RegionalFrontalZones` mit Qualitätsfilterung, Glättung und begrenzter Darstellung der dominanten Frontalzonen.

Damit bleibt die mit v0.9.84.99 beabsichtigte Vermeidung paralleler/doppelter Frontdarstellungen erhalten. Ebenso unverändert bleiben:

- selbst gerenderte, geglättete 500-hPa-Isohypsen mit gpdm-Beschriftung,
- WMS-Isobaren,
- restriktivere thermodynamische Freigabe gefrierender/fester Niederschlagsphasen,
- das neue Regen+Eis-Symbol statt der missverständlichen Spiralform,
- die Entfernung der störenden vertikalen Sky-Plate-Randstriche in Desktop-Piktogrammen.

## Regressionen

Der regionale Fronttest wurde an den aktuellen Architekturvertrag angepasst: tote Fallback-Definitionen sind nun ausdrücklich unerwünscht, und die Frontzählung schützt gegen Doppelzählung regionaler und lokaler Fronten. Zusätzlich wurde ein älterer Radar-Phasentest auf die mit v0.9.84.99 bewusst verschärften Echo-/Kälteschwellen aktualisiert. Die fachlichen Schutzbedingungen wurden dabei nicht gelockert.

## Worker

Keine fachliche Worker-Logik wurde verändert. Versionsfelder werden regulär auf v0.9.84.100 synchronisiert; ein separater manueller Worker-Upload ist nicht erforderlich.
