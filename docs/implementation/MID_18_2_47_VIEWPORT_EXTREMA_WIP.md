# MID 18.2.47 · Sichtbarkeitsgebundene Extremwerte (WIP)

## Verifizierte Basis / Abgrenzung

Ausgangsbasis `main=mid-stable=1eca0e0de84abda59d693f6ce69592f3709c7536`, `v0.9.85.316` (23.10.2026). Schutzregeln und offene PRs geprüft; PR #449 (DWD-Originaldaten), #433 (ECMWF) und #425 (RUC-Canary) bleiben unabhängig. Branch `chatgpt/v0.9.85.317-viewport-extrema` ist **nur ein Integrationsentwurf**; es erfolgte keine Änderung an Versionsspiegeln, Worker/Pages, Quellen, Pipelines, WMO-Codes oder Stable. Vollständiges DWD-Modellgebiet bleibt P1 in #446 offen.

## Nutzervertrag / Kachelmannwetter als funktionale Referenz

Das bereitgestellte Referenzbild zeigt dezente weiße Zahlen auf dem eingefärbten Modellfeld. Die Darstellung ist unabhängig umgesetzt, ohne Übernahme fremder Kartengrafiken.

- Nur **numerische Werte** an den tatsächlichen gültigen Rasterzellen für jedes im aktuellen MapLibre-Ausschnitt sichtbare Modellfeld; Minimum und Maximum als **weiße Zahlen ohne zusätzliche Präfixe/Boxen/Einheit**. Die gewählte Einheit ist bereits in Skala/Parametertitel sichtbar; Screenreader/Popup geben Werttyp, Einheit, Prognosetermin an.
- Die Auswahl erfolgt aus den **sichtbaren Zellzentren** und damit aus Quellwerten, nicht aus geglätteten/interpolierten Bildschirmfarben. Das ist eine explizite fachliche Unterscheidung: an angeschnittenen Bildrändern kann ein interpolierter Bildschirmfarbton nicht exakt als Originalmodellwert rückgerechnet werden.
- MapLibre `moveend`, `zoomend` und `resize` aktualisieren die Werte; `movestart` unterdrückt vorübergehend veraltete Marker. Auch Feld-, Modell-, Lauf-/Gültigkeitszeit- und Einheitenwechsel aktualisieren den gemeinsamen Overlay-Pfad.
- Kein gültiger Zellenwert → keine Marker (kein globaler Fallback, kein Missing→0). Bei gleichförmigem Wert nur eine Zahl; bei Gleichständen deterministisch der erste Rasterpunkt. Antimeridian/entrollte MapLibre-Längengrade berücksichtigt.
- Keine Extremwertmarkierung für diskrete WMO-Signifikantwettercodes und keine unbewiesenen WMS-Bildextrema ohne vollständiges vertrauenswürdiges numerisches Raster. Bestehende amtliche Warnungen bleiben getrennt.
- Gemeinsamer `NativeScalarOverlay` wird bereits von `NativeModelMap` und `UnifiedWeatherMap` benutzt und erreicht die aktuell echten skalaren ICON-D2-/RUC-Rasterprodukte, Temperatur, Wind/Böen, Druck, Bewölkung, Theta-E und Niederschlag, soweit jeweils ein gültiges Modellfeld verfügbar ist.
- Der vorhandene Kartenexport zeigt **das gesamte exportierte Raster** als eigenen Bildausschnitt und behält dafür das globale Rasterextrem (nicht den zufälligen UI-Zoom). Auch dort nur weiße Zahlen mit dunklem Halo und zugänglicher Typbezeichnung, kein sichtbarer Min/Max-Text. Exporte sind keine Zusage über die gesamte ursprüngliche Modellgeometrie.
- Auf Mobilgeräten werden Zahlen abhängig von den **CSS-Pixeln**, nicht dem HiDPI-Canvas-Pixelmaß, zum Karteninneren hin verankert; nah beieinanderliegende Extrema werden versetzt. Controls behalten ≥44px Touchhöhe.

## Tests und Qualitätsschranken

`scripts/test-map-scalar-annotations-0985316.mjs` erweitert die vorhandene Regression für Teilbereiche, verschobene/leer sichtbare Ausschnitte, echte Null/NoData, konstante Felder, fehlende Randwerte, datumsgrenzübergreifende Kartenausschnitte, unveränderte Eingabe, SVG-Zahl ohne sichtbares Prefix und deaktivierte Annotationen. Bisherige Isolinien-, Wind-/Einheiten- und Warnlinienprüfungen bleiben unverändert. Hier **kein** vollständiger npm-/TypeScript-/Build-/Browser-/Device-/Source-/Heavy-Nachweis; die neue PR bleibt deshalb bis zur belegten CI-/QA-Abnahme Draft.

Offen für Release: exakt gebundener Build `v0.9.85.317` mit sämtlichen Versionsspiegeln und ChangeLogs, vollständige bestehende Regressionen, echte Browser-Viewport- und Touch-/A11y-Prüfung (320/390/430/768/1024/1440px, Light/Dark, Quer/Hoch), Paketbudget und Security, regulärer Source-PR-Gate → SHA-MID-Bot → Server-ZIP → `install-mid.yml` → Worker/Pages → Stable-Promotion. Nicht freigegebene Arbeiten/Branches bewahren, keine GitHub-Schutzregeln umgehen.

Referenzen: https://kachelmannwetter.com/de/modellkarten/rapid-id2/signifikantes-wetter.html ; MapLibre event/getBounds/getCanvas-Dokumentation via Context7.
