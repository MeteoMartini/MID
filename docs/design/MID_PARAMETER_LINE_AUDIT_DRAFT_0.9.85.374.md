# MID Design-/Linienaudit – P1/P2-Fixkandidat (Entwurf, v0.9.85.374)
Ausgangsbasis: GitHub `main=mid-stable` v0.9.85.372 @ `e8e8c60ecc36447dbd21cde239fac06d58314a7d`. Vollständiger Auftrag und Matrix-Restumfang: #523. Keine Release- oder Geräteabnahme durch dieses Dokument.

## Teilumfang A1/A2: 24-h-Wetterprofil und 7-Tage-Tagesdetail
Festgestellte Abweichungen am Quellstand:
- `parameterLineStyle.ts`: UTCI (`apparent`) und Böen (`gust`) nutzten beide SVG-Muster 5/4, die für Nutzer mit Farbsehschwäche bei Überlagerung nur über Farbe/Position auseinanderzuhalten waren.
- `App.tsx`: dieselben sieben Tagesdetailpfade hatten bei vorhandenem `parameterLineStyle` gleichzeitig abweichende lokale SVG-Attribute (beispielsweise Böen 7/5 und Wahrscheinlichkeit 6/5); der Inline-Style hatte Darstellungsvorrang, aber der Code war nicht eindeutig.
- `30-modern.css`: Legenden im 24h-Profil nutzten generische CSS-`dashed`-/`dotted`-Linien, die das tatsächliche SVG-Muster nicht exakt abbildeten; das Tagesdetail nutzte bei Böen ein separates 7/4-Muster.

## Entwurfsregeln – nicht endgültiger appweiter Vertrag
| Parameter | Farbe / Token | SVG Strichmuster | Zweck |
| --- | --- | --- | --- |
| Temperatur | `--param-temperature` bzw. ausdrücklich aktivierte ECMWF-Skala | durchgehend | zentrale Haupttemperatur |
| UTCI | `--apparent-line` | 5/4 | thermisches Empfinden; eigenständig |
| Taupunkt | `--param-dewpoint` | 2/5 | fein gepunkteter Verlauf |
| Luftdruck | `--param-pressure` | durchgehend | eigene Lane/Skala |
| Niederschlagswahrscheinlichkeit | `--param-precipitation` | 4/3 | Wahrscheinlichkeit; nicht Niederschlagsmenge |
| Wind | `--param-wind` | durchgehend | mittlere Geschwindigkeit |
| Böen | `--param-gust` | 9/4 | Spitzenwind; erkennbar von UTCI abgegrenzt |

Legendenmuster in 24h und Tagesdetail entsprechen diesen Mustern; alte SVG-Doppeldeklarationen werden entfernt. Tooltipmarker für Böen und Druck verwenden kanonische Token, ohne Wetterwerte, Modelle, Warnungen, Achsen oder Datensemantik zu ändern.

## Verifikation und Begrenzung
- Neuen Source-Regressionstest `scripts/test-appwide-line-semantics-0985374.mjs` in **beiden** vollständig übereinstimmenden MID-Regressioninventaren registriert.
- Statischer Quellvergleich und deterministische Zeichenfolgenprüfung auf Dateiebene; Browser-/Geräte-/Screenshot-, Build- und Releasegates **noch nicht durchgeführt**.
- Anpassungen vor einem Source-PR-Merge müssen gegen den dann aktuellen `mid-stable`-/`main`-SHA neu geprüft, auf den nächsten freien Maintenance-Build versioniert und vollständig synchronisiert werden. Paralleler RUC-PR #522 für .373 darf nicht überschrieben werden.
- Keine Änderungen an amtlichen Warnfarben, meteorologischen Berechnungen, Modellwerten, Speicherung, Warnlogik oder Quellen.
- Offener Folgeumfang #523: aktiv wirksame CSS-Kaskaden und Kontrastwerte im echten Browser, andere Ansichten/Karten/Widgets/Exporte, alle Parameter/Interaktionen und vollständige Geräte-Matrix.
