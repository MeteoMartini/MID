# MID-Karten P1 · Umfeldwolken/SigWx – originales Referenzbild bei fehlendem Viertelstundenfeld

**Verifizierte Ausgangsbasis:** v0.9.85.486, `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`. Nur selektiver QA-Draft, kein Release und keine neue Originaldatenaktivierung.

## Ursache

`CurrentSurroundings` verwendet UTC-Zielzeiten im Abstand 15 Minuten. Dagegen publiziert der bestehende MID-Synoptik-/CloudWeather-Index überwiegend stündliche zusammengehörige Wolken-/SigWx-Originalfelder. `loadVerifiedSurroundingsCloud` fordert strikt `Date.parse(ref.time)===target`, ebenso der native D2-Ersatzpfad und die nachgelagerte synchrone Orts-/Zielzeitwache. Außer zu tatsächlichen stündlichen Originalterminen blieb deshalb das Wolkenbild oft leer. Dies ist ein reproduzierbarer Codebefund, nicht die Behauptung einer gemessenen externen API-Störung.

## Datenintegrität und Bedienentscheidung

1. **Exakte Originalprognose hat absoluten Vorrang.** Der bestehende Laufzeitloader, die SHA-/Raster-/Run-Originalzeitchecks und `matchesSurroundingsCloudRequest` bleiben strikt unverändert. Es gibt keine synthetisch interpolierten 15-Minuten-SigWx-Codes.
2. Existiert für die ausgewählte 15-Minuten-Zielzeit kein verifiziertes gleichzeitiges Original, darf MID einen zeitlich **früheren** eindeutigen Wolken- und Wetteroriginaltermin (niemals zukünftige Zeit) aus demselben veröffentlichten Modellkatalog **ausschließlich als separates Referenzbild** nachladen. Maximaler Abstand: 45 Minuten; ausschließlich tatsächlich vorhandene UTC-Frames und dieselben SHA-gebundenen Decoder/Maps. Verfügbarkeit ist keine amtliche Wetterbeobachtung.
3. `reference.requestTargetTime` bindet dieses Bild an den gerade gewählten UTC-Zieltermin, `requestLatitude/requestLongitude` an den tatsächlichen Ort. Ein anderer Ort oder Zielzeitpunkt blendet es synchron **vor dem nächsten React-Effekt** aus. Das echte `reference.validTime` und sein `run` bleiben unverändert.
4. Die UI verwendet einen gesonderten Referenz-Rasterlayer und explizit **„Referenzbild“**, **„Original gültig ...“** sowie **„Gewählt ...; hierfür kein bestätigtes Original“**. Der Zieltermin bleibt meteorologisch NoData; ein vorhandenes Stundenbild ist weder eine 15-Minuten-Prognose noch Satellitenmessung, amtlicher WMO-Wettercode oder DWD-Warnung. Die Detailkarte erhält weiterhin die vom Nutzer ausgewählte Zielzeit.
5. Ist weder ein exaktes noch ein geeignetes jüngeres älteres Original zugänglich, bleibt die bisherige ehrliche Nichtverfügbarkeitsanzeige bestehen. Der produktive RUC-Raster-/Worker-/Pages-/IR10.8/GSP-Code wird nicht verändert.

## Qualität und Restgates

- Rein logische Unit-Tests für exakte vs. vorherige Modelloriginale, 45-Minuten-Grenze, UTC/Zeitzonenumstellung, Priorität, Orts-/Zeitbindung, fremde oder fehlende Quellen.
- Der bestehende `scripts/test-current-surroundings-temperature-0985476.mjs` und `tests/unit/surroundings-15min-original-mode-qa.test.ts` behalten ihre strikten Original-only-Assertions.
- Zusätzlicher echter Chromium-/React-/MapLibre-Browserpfad mit SHA-gültigem stündlichem Modellindex, Bilddaten und getrennten Statusmeldungen; Bildschirmbreiten entsprechend bestehenden MID-Browser-Shards. Der Browsertest prüft keine realen DWD-GRIBs und keine iOS-/VoiceOver-Applikation.
- Live-Runtime-Diagnostik bei `https://www.midwx.app/ruc/latest.json` ist im aktuellen Zugriff nicht möglich; deshalb wird **kein** bestätigter Produktivnetzstatus oder iOS-Status behauptet.
- Vor Integration die Source-PR-/Core-/Heavy-/Browser-/Review-/SHA-Merge-/ZIP-/Installer-/Worker-/Pages-/Stable-Gates mit dem jeweils neuen HEAD und Branch-Provenienz durchführen; der Leitchat verwaltet die Releaseentscheidung.

## Weiteres Potenzial

P1: Eine echte modellgebundene `availability`-Zeitachse (statt überall 15-min-Erwartung) und im UI getrennte Diagnosen für Index fehlt, zu alter Modelllauf, keine Zeitüberschneidung, Feld/Bitmap defekt, leere transparente Wetterfläche und Offline-/Netzfehler. Erst wenn originaler 15-Minuten-DWD-IR10.8/GSP-Pfad aus #832 unter vollständigen Gültigkeits-/Georeferenz-/Publikationsgates integriert ist, eine separate originale 15-Minuten-Ansicht aktivieren; GSP-Raten allein sind keine vollständigen WMO-SigWx-Kategorien.

DWD-Primärbelege: https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/ (CLCT, WW, IR10.8 und PR*GSP existieren als unterschiedliche Produkte) und ICON Database Reference 2.5.2 (2025). Die zeitliche Auflösung je Feld muss konkret für den aktuellen Modelllauf verifiziert werden; nicht von der bloßen Existenz eines Parameters auf ein passendes MID-Raster schließen.
