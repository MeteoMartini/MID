# MID v0.9.24.0

## Radar-, Meteogramm- und Wetterkarten-Folgefixes

Diese Version bündelt die noch offenen Korrekturen aus MID 16.2 für den DWD-Niederschlagsart-/Satbild-Block, das 24-h-Meteogramm sowie die Wetterkarten.

### Umgesetzt
- **DWD-Radarblock umbenannt:** Titel sowie Zeitstempel-Labels wurden auf **„Niederschlagsart/Satbild“**, **„Niederschlagsart“** und **„Satbild“** umgestellt.
- **Verortung des Radar-/Satbild-Ausschnitts korrigiert:**
  - die Marker- und Klick-Georeferenzierung nutzt jetzt einen expliziten **Kartenausschnitt innerhalb des DWD-NinJo-Bildes** statt Rand-/Footer-/Legendenbereiche mitzuzählen;
  - dadurch werden Standortmarker und Bildpunkt-Auswertung konsistenter auf den tatsächlichen Kartenbereich bezogen.
- **Mobile Bildausschnitte zurückgenommen:**
  - der Crop für kleine Displays wurde wieder verkleinert, damit der Ausschnitt nicht unnötig vergrößert erscheint.
- **24-h-Meteogramm auf Desktop nachgezogen:**
  - die Chartbreite orientiert sich jetzt an der tatsächlichen Canvas-/Containerbreite;
  - dadurch füllt das Diagramm den Desktop-Bereich sauberer aus und bleibt mit Achsen/Overlays synchron.
- **Wetterkarten robuster gemacht:**
  - der Worker lässt jetzt die vollständigen im Modul definierten DWD-WMS-Layer konsistent zu, statt nur einer Teilmenge;
  - damit werden fehlende/blanke Karten aufgrund einer zu engen Allowlist vermieden.
- **SIGWX der ICON-Serie ergänzt:**
  - zusätzliche **SIGWX-/Wettercode-Karten** für **ICON-D2, ICON-EU, ICON Global und AICON** wurden ergänzt.

### Regression
Geprüft mit:
- `scripts/test-maintenance-recharts3-cache-ci-08260.mjs`
- `scripts/test-dwd-radar-meteogram-alignment-09211.mjs`
- `scripts/test-weather-maps-module-09210.mjs`
- `scripts/test-radar-weather-maps-interaction-09220.mjs`
- `scripts/test-dwd-radar-worker-payload-buildfix-09221.mjs`
- `scripts/test-radar-weathermaps-followups-09230.mjs`
