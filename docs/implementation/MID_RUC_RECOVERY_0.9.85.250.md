# MID v0.9.85.250 – P0: RUC-Publikation nach Python-Syntaxfehler wiederherstellen

## Gesicherte Basis und Störung
Die freigegebene GitHub-Basis vor diesem Hotfix ist `main = mid-stable = 20a07155d45e6cc264736e0bae9a55f3f2a47361`, MID v0.9.85.249. In der Produktionspipeline scheiterten seit dem Upgrade viele RUC-Runs **nach erfolgreichem Download, Dekodieren und Modelllauf-Auswahl** bei `RUC-Wire- und Pages-Free-Profil prüfen`, noch vor einer Pages-Veröffentlichung.

Beleg: GitHub-RUC-Lauf [#38506576222](https://github.com/MeteoMartini/MID/actions/runs/38506576222) (weitere #38504848046, #38503115688). Die Python-Fehlermeldung lautet:
```text
File "tools/ruc/lossless_codec_pilot.py", line 48
    return ({'schema': SCHEMA, 'codec': codec, ...
SyntaxError: '(' was never closed
```
Der Test `tools/ruc/test_prepare_ruc_pages.py` importiert `test_lossless_codec_pilot.py`, das den Codec-Prototyp importiert. Diese Fehlerkette ist **nicht** auf DWD-Daten, RUC-Prognosewerte oder Speichermangel zurückzuführen. Bis zum eindeutigen Nachweis des nächsten veröffentlichen RUC-Laufs darf ein erfolgreicher RUC-Watchdog nicht als Wiederherstellung gelten.

## Minimaler Fix und Frühwarn-Gates
1. In `tools/ruc/lossless_codec_pilot.py` die fehlende schließende Klammer des `return`-Ausdrucks wiederherstellen. Keine Änderung des fachlichen Algorithmus.
2. **RUC GitHub Action:** Alle `tools/ruc/*.py` vor Installation der schweren DWD-Tools und vor Netzwerk-/GRIB-Download mit `ast.parse` syntaktisch prüfen. Das benötigt keine third-party Pakete, verändert keine DWD-Daten und failt schnell. Die etablierte vollständige `test_prepare_ruc_pages.py`-Regression bleibt anschließend verpflichtend.
3. **Source-PR-Gate:** Die bereits verpflichtende `scripts/test-module-css-consolidation-0985170.mjs`-Regression führt in CI zusätzlich denselben Python-`ast.parse`-Check aus. Ein künftig ungültiger Python-Quelltext muss deshalb **vor** dem Release-Gate scheitern.
4. Sämtliche Versionsspiegel, Changelog und bestehende Worker-/iOS-Build-Identitäten auf v0.9.85.250 synchronisieren.

## Unveränderte Grenzen
Keine produktive Codec-/Kompressionsumschaltung, kein neuer API-Wire-Contract, keine RUC-Pages-/Worker-Payload-Modifikation, keine veränderten DWD-Raster, Grenzwerte, Missing-Data-Sentinels, Kartenzeiten, Quota-, Berechtigungs- oder Branchschutz-Gates.

## Veröffentlichung/Abnahme
Regulär über Source-PR-Gate → SHA-kontrollierter Auto-Merge → serverseitiges ZIP → Installer mit Produktionsbuild/Security/Regression/iOS → Worker/Pages → Stable-Promotion. **Danach einen neuen** RUC-Schedule/Recovery-Lauf auf der neuen Stable-SHA abwarten; erst bei erfolgreichen `prepare`, `publish` und Worker-/Pages-Health mit tatsächlich neuer DWD-Run-ID als wiederhergestellt markieren. Vorheriger Dateirückstand gilt weiter als offen. Physische iOS-/VoiceOver-Abnahme wurde nicht durchgeführt.
