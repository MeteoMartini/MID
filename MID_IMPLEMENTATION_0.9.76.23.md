# MID v0.9.76.23 – Feinschliff 24-h-Wetterprofil, DWD-Ortspin und Tages-Windpfeile

## Anlass
Im zuletzt ausgelieferten Stand waren trotz der vorangegangenen Überarbeitung noch sichtbare UI-Mängel vorhanden:
- Im 24-h-Wetterprofil konnten **Einzelkästchen** in Thermik-, Niederschlags- und Wolkenbändern bei dichter Stundenfolge optisch überlappen.
- Die Achsenwerte wirkten je Register noch nicht vollständig einheitlich an der Achse ausgerichtet.
- Die Temperaturkurve sollte nochmals näher an die dünnere Anmutung der Tagesansicht gebracht werden.
- Im DWD-Modul verdeckte der Ortsmarker noch zu viel vom amtlichen Originalbild; gefordert war eine kompaktere **Stecknadel**.
- In der Tagesansicht sollten **Windpfeile** appweit anhand derselben DWD-**Warnschwelle** wie im 24-h-Profil eingefärbt bleiben.

## Umsetzung
1. **Kollisionsfreie Profilzellen im 24-h-Profil**
   - `src/ForecastCockpit.tsx` verwendet für Thermik-, Niederschlagswahrscheinlichkeits-, Wolken- und Hazard-Bänder jetzt konsequent die reale Spaltenbreite zwischen den Nachbarzentren.
   - Die Bandgeometrie kappt Mindestbreiten an der tatsächlich verfügbaren Zellspanne. Dadurch bleiben alle Einzelkästchen innerhalb ihrer Stunde und übermalen benachbarte Stunden nicht mehr.
   - Die Touch-Hitflächen bleiben dabei funktionsfähig, ohne dass die sichtbaren Zellen wieder künstlich aufgeweitet werden.

2. **Einheitlichere Achsenwerte**
   - Die SVG/CSS-Ausrichtung der linken und rechten Skalenbeschriftungen wurde präzisiert.
   - Linke Achsenwerte hängen wieder konsistent rechtsbündig direkt an derselben Achse; rechte Werte starten konsistent linksbündig neben ihrer Achse.
   - Dadurch erscheinen Temperatur-, Niederschlags-, Wind- und Luftdruckwerte visuell sauberer ausgerichtet.

3. **Dünnere Temperaturkurve**
   - Die 24-h-Temperaturkurve bleibt auf `stroke-width: 3.35` und entspricht damit der schlankeren, polierteren Tagesansicht-Anmutung.

4. **Kompakter DWD-Ortsmarker**
   - `src/DwdPrecipitationTypeRadar.tsx` belässt im Bild nur noch die kompakte Stecknadel ohne zusätzlichen Text über dem Motiv.
   - Die zugehörigen Styles halten den Marker klein, fokussierbar und mit möglichst geringer Bildabdeckung.

5. **Warnfarbige Tages-Windpfeile**
   - Die appweite Windpfeil-Komponente wertet die Böe weiterhin für die Warnstufe aus.
   - Tageskarten, Stundenlisten und Tooltip-/Detaildarstellungen übergeben die Böe konsequent an die Windpfeile, sodass die Einfärbung nach Warnschwelle konsistent bleibt.

## Verifikation
Geprüft wurden insbesondere:
- `scripts/test-weather-profile-cell-gaps-day-wind-pin-097620.mjs`
- `scripts/test-cloud-profile-structures-09740.mjs`
- `scripts/test-mid-weather-profile-axes-09322.mjs`
- `scripts/test-dwd-precipitation-type-radar-09200.mjs`
- TypeScript-Check und Produktionsbuild

## Worker
Keine fachliche Worker-Änderung. Der Worker wurde nur versionsseitig mitsynchronisiert. **Ein manueller Worker-Upload ist nicht erforderlich.**
