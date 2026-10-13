# MID v0.9.85.247 – Radar-Favoriten, Kartenränder, D2-Zeitschritte und CSS-Fortsetzung

## Herkunft und Governance
Verifizierte Basis `main = mid-stable = b97b0cb23f6f2a9e5f2e648db1f33e321f41b293` (v0.9.85.246). Umsetzung nur auf `chatgpt/v0.9.85.247-forecast-radar-cloud-map-audit`. Bestehende Release-Gates werden nicht geändert. Keine Behauptung physischer iOS/WKWebView- oder VoiceOver-Abnahme.

## A. Prognose-Radar – Screenshot 13.10.2026, Rheidt: 0 Stände, Fehler
- `src/ForecastChangeArchive.ts` hatte das aktuelle Favoritenziel grundsätzlich aus dem hintergrundähnlichen Abruf ausgeschlossen. Ein vorhandener Ort konnte dadurch ohne erfasste Hauptansichtsdaten auf 0 archivierten Ständen bleiben.
- Die neue Auswahl `dueForecastArchiveFavorites` berücksichtigt **alle** Favoriten einschließlich des aktuellen Ortes; nur duplizierte Koordinaten werden einmal geladen. Erfolgreich archivierte Orte werden spätestens nach 30 Minuten bei sichtbarer App wieder fällig. Fehlgeschlagene oder unvollständige Erfassungen werden nach 5 Minuten erneut versucht; zwei Abrufe gleichzeitig bleiben die Obergrenze.
- Diagnostik trennt `fetch`, `storage`, `invalid-data`, `stale` und `incomplete`, ohne den existierenden Daten-/Best-Match-Vertrag und ohne Null-zu-0-Ersetzung.
- Der Nachweis beruht auf synthetischen Tests und der Prüfung, dass Archivstände tatsächlich nach dem Schreibversuch aus dem lokalen Speicher lesbar sind. **Die konkrete Nutzerdatenbank auf dem Gerät ist von CI nicht einsehbar.** Keine echten Server-Push-Abfragen einer geschlossenen App – erforderlich wären ein eigener datenschutzgeprüfter Server-Snapshot-Dienst, Rechte und Budget.

## B. Kartenüberlagerung / Grenzen
- `src/RadarPanel.tsx` legt referenzierte Küsten-/Länder-/Orts-Vektoren bei `zIndex=790` oberhalb von Wolken-/Wetterflächen mit `zIndex=300/305` ab. Die MapLibre-Reihenfolge wird nach numerischen Prioritäten sortiert. Pflichtregression sichert diese Hierarchie.
- Der Kontrast der Grenzen in Light/Dark wurde verstärkt, ohne meteorologische Farbpaletten oder Kategorien umzubenennen. Die Bedienoption, Referenzlayer auszuschalten, bleibt unangetastet.
- Offene Realbrowser-Frage: Ob die Referenzvektorkacheln auf dem betroffenen Gerät geladen sind und wie Linien bei unterschiedlichen Zoomstufen wirken. Nicht behaupten, das Bild sei bereits live nachgestellt.

## C. Mehr ICON-D2-Karten / RUC-Möglichkeiten
- DWD dokumentiert ICON-D2 mit +48 Stunden und RUC mit +14 Stunden, letzteren mit stündlichen Läufen. Dies ist ein **Modellhorizont, keine Garantie aller Dateipaare** (DWD ICON-D2 Beschreibung, 2025).
- `tools/ruc/build_cloud_weather_fields.py` versucht nun für ICON-D2 vollständig gepaarte CLCT+WW-Felder stündlich bis einschließlich +18 h statt +12 h. Bisherige Schritte +21/+24/+30/+36/+42/+48 bleiben erhalten; ICON-EU/ICON unverändert. Dekoder prüft Feldstempel, Grid, meteorologische Einheit WMO 4677, >=40% gekoppelte Finite-Zellen, Herkunft, Prüfsumme und Termin; gemeinsames 600-s-Downloadbudget bleibt.
- **Es werden nur erfolgreich erzeugte, geprüfte Frames ins Manifest übernommen**; keine Interpolation fehlender WMO-Wettercodes, keine erfundenen Stunden. Die tatsächliche neue Stundenanzahl muss anhand eines vollständigen RUC-Pipeline-Laufs und des veröffentlichten Manifests bestimmt werden.
- Die parallele native ICON-D2-Kartenpipeline lädt derzeit für ihre weiteren Parameter die Schritte 1–6, 12, 24, 48. Höhere Frequenz wäre ein **separater Kapazitäts- und Größenvertrag** mit DWD-Quelldateiverfügbarkeit, R2-/Pages-Limits, erzwungenem Vorhersage-Horizont und Freigabe.
- Vorhandene RUC-Nativfelder (Temperatur, Feuchte, Druck, Bewölkung, Wind, Niederschlag u.a.) und Koordinatengitter könnten grundsätzlich für neue RUC-Prognosekarten auf +0–14 h aufbereitet werden. Der heutige RUC-Bundle-Transport ist aber nicht bereits eine veröffentlichte, kartenfertige georeferenzierte Rasterproduktserie. Neue RUC-Karten nur mit eigenem Manifest, Zeit-/Lauf-/Einheitenvertrag, räumlicher Qualitäts-/Fehlwertmaske und geprüftem Speicher-/Ladebudget. Keine Verschleierung von RUC-Karten als ICON-D2.

## D. CSS-Paket / Folgestufe B-C
- Aktueller Haupt-CSS-Chunk nahe 1,76 MB roh, Start-CSS-Budgetmessung seit .246. Vite CSS code splitting ist bereits aktiv. Die kanonische globale Kaskade umfasst 70 Quellen und ist in `scripts/test-module-css-consolidation-0985170.mjs` mit Parität zur .169-Basis geschützt.
- Kandidat für erste Auslagerung: `src/styles-src/25-extreme-outlook.css` (~23.957 Quellbytes, auf Extremwetteransicht ausgerichtet), deren React-Modul lazy geladen wird. Allerdings liegen einige generische Klassen in selektorbegrenzten Regeln; erst Browser-Kaskadenvergleich und kanonisches Neu-Generieren von `midPresentation.css` gewährleisten, dass keine Styles und kein Export umspringen.
- **In .247 erfolgt deshalb keine unvalidierte Änderung der globalen CSS-Kaskade; eine Byte-Einsparung wird nicht behauptet.** Die Priorität #344 bleibt bestehen. Es braucht eine Ausführungsumgebung mit vollständiger Repository-Kopie zum gesicherten Rebuild der >1-MB generierten CSS-Datei, inklusive Layout-/Paint-Parität in allen Modi; danach kann ein separates Release die gemessene Reduktion übernehmen. Kein Abschwächen der Goldenen CSS-Paritätsprüfung.

## Reproduktions- und Releasebedingungen
`scripts/test-forecast-archive-range-0985244.mjs` deckt Wiederholungslogik für aktuellen und geschlossenen Favoriten, Aufbewahrung, Unverändertheit, Quota-Fehler sowie Wetterkontext ab. `scripts/test-cloud-significant-weather-0985231.mjs` sichert D2-Zeitkandidaten und Vektor-vor-Raster-Layerfolge. Vor Stable-Promotion sind Source-PR-Gate, vollständige Installer-Core/Heavy-Matrix, Sicherheitsprüfungen, Web/iOS-Hülle, Worker/Pages und SHA-verifizierte Stable-Promotion erforderlich.
