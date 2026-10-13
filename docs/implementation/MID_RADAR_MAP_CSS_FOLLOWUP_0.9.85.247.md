# MID v0.9.85.247 – Radar-Favoriten, Kartenränder, D2-Zeitschritte und CSS-Fortsetzung

## Herkunft und Governance
Verifizierte Basis `main = mid-stable = b97b0cb23f6f2a9e5f2e648db1f33e321f41b293` (v0.9.85.246). Umsetzung nur auf `chatgpt/v0.9.85.247-forecast-radar-cloud-map-audit`. Bestehende Release-Gates werden nicht geändert. Keine Behauptung physischer iOS/WKWebView- oder VoiceOver-Abnahme.

## A. Prognose-Radar – Screenshot 13.10.2026, Rheidt: 0 Stände, Fehler
- `src/ForecastChangeArchive.ts` hatte das aktuelle Favoritenziel grundsätzlich aus dem hintergrundähnlichen Abruf ausgeschlossen. Ein vorhandener Ort konnte dadurch ohne erfasste Hauptansichtsdaten auf 0 archivierten Ständen bleiben.
- Die neue Auswahl `dueForecastArchiveFavorites` berücksichtigt **alle** Favoriten einschließlich des aktuellen Ortes; nur duplizierte Koordinaten werden einmal geladen. Erfolgreich archivierte Orte werden spätestens nach 30 Minuten bei sichtbarer App wieder fällig. Fehlgeschlagene oder unvollständige Erfassungen werden nach 5 Minuten erneut versucht; zwei Abrufe gleichzeitig bleiben die Obergrenze.
- Diagnostik trennt `fetch`, `storage`, `invalid-data`, `stale` und `incomplete`, ohne den existierenden Daten-/Best-Match-Vertrag und ohne Null-zu-0-Ersetzung.
- Der Nachweis beruht auf synthetischen Tests und der Prüfung, dass Archivstände tatsächlich nach dem Schreibversuch aus dem lokalen Speicher lesbar sind. **Die konkrete Nutzerdatenbank auf dem Gerät ist von CI nicht einsehbar.** Keine echten Server-Push-Abfragen einer geschlossenen App – erforderlich wären ein eigener datenschutzgeprüfter Server-Snapshot-Dienst, Rechte und Budget.

## B. Kartenüberlagerung / Grenzen
- Ursache präzisiert: `WeatherMapsPanel` und `NativeModelMap` zeichneten die Kartenreferenz nur als kontrastschwaches HTML-Canvas, während Kompositkarten eigene überlagernde Vektorebenen verwenden. Jetzt rendert `ModelMapContextOverlay` die Natur-Erde-Länder-/Verwaltungsgrenzen als echte MapLibre-GeoJSON-Layer mit numerischer Priorität 790 über separaten Modellrastern; Beschriftungen liegen als Canvas bei 800. Die Kompositkarten bleiben unverändert.
- Kontrastreiche zweifarbige Grenzkonturen bleiben auf hellen/dunklen und intensiven Modellfarben sichtbar, ohne Meteorologie-Farbpaletten oder die vorhandene Komposit-Referenzlayer-Einstellung zu verändern.
- Offene Realbrowser-Frage: Ob die Referenzvektorkacheln auf dem betroffenen Gerät geladen sind und wie Linien bei unterschiedlichen Zoomstufen wirken. Nicht behaupten, das Bild sei bereits live nachgestellt.

## C. Mehr ICON-D2-Karten / RUC-Möglichkeiten
- DWD dokumentiert ICON-D2 mit +48 Stunden und RUC mit +14 Stunden, letzteren mit stündlichen Läufen. Dies ist ein **Modellhorizont, keine Garantie aller Dateipaare** (DWD ICON-D2 Beschreibung, 2025).
- **Korrektur aus realem RUC-Lauf:** Der erfolgreiche RUC-Prepare-Job `115107392113` im Workflow `38339599703` für den Lauf `2026-10-13T02:00` protokolliert `publishedBytes: 898877281`, `budgetBytes: 900000000`, `remainingBytes: 1122719` im `mid.ruc.storage-audit.v1`. Schon wenige zusätzliche flächenhafte Frames könnten den Publish-Guard auslösen und die gesamte RUC-Aktualisierung gefährden. Diese Evidenz ersetzt die vorherige nicht abgesicherte Expansionsannahme.
- Die D2-Cloud/WW-Generatorfolge bleibt daher zunächst **unverändert** (0..12 stündlich, 15/18/21/24/30/36/42/48). Der reale vorgenannte Lauf veröffentlichte 20 D2-Wolken-/Wetter-Zeitpunkte: +1..+12, +15, +18, +21, +24, +30, +36, +42, +48; +0 fehlte als echtes Quellenpaar. ICON-EU/ICON unverändert. Keine erfundenen oder interpolierten WMO-Wettercodes.
- Zusätzliche +13/+14/+16/+17 und spätere stündliche Termine erfordern zunächst eine sichere, getestete Reduktion anderer RUC-Snapshotdaten oder ein normatives größeres Budget mit nachgewiesener R2-/Pages-Eignung. `tools/ruc/build_cloud_weather_fields.py` wird deshalb im v0.9.85.247-Kandidaten auf den verifizierten Stable-Zeitplan zurückgesetzt.
- Der native D2-Kartenpfad lädt 1..6, 12, 24, 48 für weitere Parameter; mehr Stunden würden denselben Speicherblocker betreffen.
- **RUC-Modelldaten erlauben grundsätzlich eigene Kartenprodukte**, sind aber nicht automatisch vollständige, kartenfertige Rasterserien. Dedizierter, fachlich validierter Pilot #350 für Temperatur/Druck mit Lauf-/Grid-/Einheiten-/Fehlwert-/Speichervertrag.

## D. CSS-Paket / Folgestufe B-C
- Aktueller Haupt-CSS-Chunk nahe 1,76 MB roh, Start-CSS-Budgetmessung seit .246. Vite CSS code splitting ist bereits aktiv. Die kanonische globale Kaskade umfasst 70 Quellen und ist in `scripts/test-module-css-consolidation-0985170.mjs` mit Parität zur .169-Basis geschützt.
- Kandidat für erste Auslagerung: `src/styles-src/25-extreme-outlook.css` (~23.957 Quellbytes, auf Extremwetteransicht ausgerichtet), deren React-Modul lazy geladen wird. Allerdings liegen einige generische Klassen in selektorbegrenzten Regeln; erst Browser-Kaskadenvergleich und kanonisches Neu-Generieren von `midPresentation.css` gewährleisten, dass keine Styles und kein Export umspringen.
- **In .247 erfolgt deshalb keine unvalidierte Änderung der globalen CSS-Kaskade; eine Byte-Einsparung wird nicht behauptet.** Die Priorität #344 bleibt bestehen. Es braucht eine Ausführungsumgebung mit vollständiger Repository-Kopie zum gesicherten Rebuild der >1-MB generierten CSS-Datei, inklusive Layout-/Paint-Parität in allen Modi; danach kann ein separates Release die gemessene Reduktion übernehmen. Kein Abschwächen der Goldenen CSS-Paritätsprüfung.

## Reproduktions- und Releasebedingungen
`scripts/test-forecast-archive-range-0985244.mjs` deckt Wiederholungslogik für aktuellen und geschlossenen Favoriten, Aufbewahrung, Unverändertheit, Quota-Fehler sowie Wetterkontext ab. `scripts/test-cloud-significant-weather-0985231.mjs` sichert D2-Zeitkandidaten und Vektor-vor-Raster-Layerfolge. Vor Stable-Promotion sind Source-PR-Gate, vollständige Installer-Core/Heavy-Matrix, Sicherheitsprüfungen, Web/iOS-Hülle, Worker/Pages und SHA-verifizierte Stable-Promotion erforderlich.
