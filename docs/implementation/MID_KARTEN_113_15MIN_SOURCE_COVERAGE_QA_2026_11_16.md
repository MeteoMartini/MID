# MID-Karten 1.13 · 15-Minuten-IR/GSP-Originalachsen: Quelle → Zeitachse (QA-DRAFT)

**Basis:** `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957`, veröffentlichte Version v0.9.85.486; fünf aktive Branch-Rulesets. Keine Release- oder Produktivfreigabe.

## Neues fachliches Prüftor

`tests/helpers/surroundings15minShadowCoverage.ts` ordnet die **bereits vorhandene private** Zehn-Paar-Vorschau aus Karten-Draft #832 (`mid.ir108-gsp.original-native-preview.shadow.v1`) und den unabhängigen Post-Render-Readback aus #848 (`mid.ir108-gsp.pair-readback.shadow-qa.v1`) der **tatsächlich auswählbaren** zehn 15-Minuten-UTC-Termine der MID-Umfeldkarte zu. Die reine Zuordnung ist ohne Netz- und Produktivzugriff reproduzierbar; keine bestehenden Implementierungsdateien, Worker, Publisher, CSS, Release-Gates oder Versionsspiegel wurden geändert.

- Jedes Quellbild behält den eigenen unveränderten `validTime` und denselben `run`. Abwesenheit eines Originalpaares ergibt ein explizites Loch, keinen Ersatzwert, interpoliertes Bild oder Null-Niederschlag.
- Originalname, SHA-Format, Bytebudget, Zeitfolge, Run-/14h-Grenze, native 542040-Zell-Identität, nachgewiesene NoData-ID 255 ≠ no-GSP-signal 0 und getrennte IR/GSP-Assets werden geprüft.
- Der separate Readback-Receipt wird auf exakte Run-/Zeit-/Anzahlidentität abgeglichen. **Das beweist noch nicht**, dass die behaupteten SHA-/CRC-/Pixel- und GRIB/ecCodes-Prüfungen wirklich durchgeführt wurden; diese müssen separat ausführbar und SHA-gebunden erfolgen.
- `independentlyVerified=false`, `liveDataDelivered=false`, `activationAuthorized=false`, `releaseAuthorized=false` sind **unveränderliche Rückgabewerte**. `IR10.8` ist Strahlungshelligkeitstemperatur (K), kein `CLCT`-Bedeckungsgrad; GSP-Raten/Phasen sind keine vollständigen originalen WMO-4677-`WW`-Felder. Deshalb bleiben `nativeClct=false` und `originalWmoSigwx=false` für jeden Slot.
- Der fachlich geprüfte WMO-/SigWx-Erweiterungsalgorithmus ist noch nicht implementiert und darf ohne separate Kalibrierung und Nachweise nicht als amtliches Modelloriginal gekennzeichnet werden.

## Handoff und Abnahme

Diese additive QA-Dateigruppe ist bewusst **nicht** der produktive `src/`-Importpfad. Sie ergänzt die bereits vorhandenen und nicht erneut zu mergenden Spezial-PRs #832/#848. Vor dem produktiven Einsatz fehlen: echte Originaldateien eines aktuellen DWD-Laufs mit identischer IR-Kanalkennung, vollständige ecCodes-/Spektral-/Bitmap-/Raster-/SHA-Validierung, real ausgeführter Pixel-Readback, atomarer zulässiger Public Publisher, ein separat versioniertes 15-Minuten-Katalogschema statt der stündlichen `SynopticFrame.hour`-Annahme, integrierter Browser-Decoder mit NoData-/Laufzeitbindung, Rechte-/Lizenz-Readback, Light/Dark-/Touch-/WebKit-/iOS-/Performance-Gates und der vollständige MID Source-PR→Installer→Worker/Pages→Stable-Pfad.

**Primärquellen:** https://opendata.dwd.de/weather/nwp/v1/m/icon-d2-ruc/p/ und https://www.dwd.de/DWD/forschung/nwv/fepub/icon_database_main.pdf (ICON Database Reference 2.5.2, Kapitel 11). Die Dokumentation publiziert IR10.8 und GSP 15-minütlich, CLCT/WW getrennt mit eigener Taktung. Open-Meteo-15min-`weather_code` ersetzt nicht die native amtliche DWD-Originalcode-Provenienz.

**Erwartetes Ergebnis:** ausschließlich `QA DRAFT / NO READY / NO MERGE / NO RELEASE`. Übernahme nur nach SHA-/Blobvergleich durch Leitchat #858. Die Datenlieferung an Endnutzer ist damit noch **nicht** umgesetzt.
