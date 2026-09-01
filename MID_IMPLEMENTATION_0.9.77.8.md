# MID Umsetzung v0.9.77.8

## Extremwetter: I/P-Schwellenintegrität

- Die vier MID-Intensitätsstufen I1–I4 bleiben für Regen, Sturm, Schnee, Eisregen und Gewitter zentral definiert.
- P1–P4 bleibt davon getrennt die Wahrscheinlichkeit, dass die jeweils dargestellte I-Stufe erreicht oder überschritten wird.
- In der UI werden Intensitätsschwelle und tatsächliches Modellsignal jetzt ausdrücklich nebeneinander gezeigt. Ein Wert wie 7,4 mm/6 h wird damit nicht mehr optisch als I4-Schwelle missverstanden; bei I4/6 h steht die Vergleichsschwelle 90 mm/6 h sichtbar daneben.
- Kontur-/Flächenstufen aktualisieren ihre Schwellenreferenz zusammen mit der dargestellten I-Stufe; dadurch können repräsentative Zellmetriken nicht mehr mit einer anderen Konturintensität verwechselt werden.
- Niederschlags- und Schneefenster dürfen nicht mehr in den vorherigen Auswertezeitraum zurückgreifen.

## ICON-D2-RUC über die vollständige Laufzeit

`rapid-extreme.json` wird auf Schema `mid.dwd.ruc.rapid-extreme.v3` erweitert:

- +0–6 h: native 5-/15-min-Niederschlags- und Konvektionsdiagnostik plus stündlicher Zustandskern,
- +6–12 h: stündlicher RUC-Zustandskern,
- +12–14 h: stündlicher RUC-Zustandskern als explizite Teilabdeckung des UI-Fensters +12–24 h,
- ab +14 h: keine RUC-Unterstellung; +24–48 h bleibt bei ICON-D2/ICON-D2-EPS.

RUC-Niederschlag stützt eine Intensitätsstufe nur noch, wenn die reale 1-h- bzw. bei vollständiger Abdeckung 6-h-Schwelle erreicht wird. Der frühere subthreshold-Pseudoprobabilitätsweg aus 5-min-Raten wurde entfernt. Wind wird analog an den höhenabhängigen Böenschwellen geprüft. Gewitter-RUC bleibt ingredient-basiert (CAPE/CIN plus Niederschlag/Organisation) und darf ohne passende Basis kein synthetisches Hochstufensignal erzeugen. Für Schnee/Eis liefern Temperatur, Feuchte, Nullgrad-/Schneefallgrenze und native Phasendaten diagnostische Stützung, ohne aus unzureichenden Parametern eine künstliche Intensitätswahrscheinlichkeit abzuleiten.

## PR-Housekeeping

PR #24, #25 und #26 sind im MID-Stand bereits umgesetzt. Der verbundene GitHub-Zugang verweigert das Schließen mit HTTP 403; die PRs sind daher lokal als erledigt/superseded dokumentiert. React-19-/plugin-react-6-PRs #6/#18/#20/#21 bleiben bewusst zurückgestellt.

## Regression

Neu: `scripts/test-extreme-threshold-ruc-horizon-09778.mjs` schützt I1–I4, P-Klassen, periodengrenzenfeste Rollfenster, subthreshold-sichere RUC-Unterstützung, Schema v3 und die echte +0–14-h-Abdeckung.

## CI-/Produktiv-Health-Hotfix nach Run #814 / Issue #27

- GitHub-Installer #814 scheiterte ausschließlich am TypeScript-Gate `TS6133`: `pointsForMetric()` deklarierte den nicht verwendeten Parameter `height`. Der Parameter und die beiden Aufrufargumente wurden entfernt; die Fachlogik des Trend-14d+-Charts bleibt unverändert.
- Der Produktiv-Healthcheck unterscheidet jetzt kritische MID-Kernverträge von regionalen Zusatzmodellpfaden. Best Match/Mond, ECMWF AIFS Europe Ensemble, EU-AQI und 6-h-Min/Max bleiben fail-closed.
- Météo-France- und JMA-Einzelmodelle werden weiterhin aktiv geprüft, aber ein temporärer Upstream-5xx wird als sichtbare Provider-Degradation gemeldet und setzt nicht mehr die komplette MID-Website fälschlich auf „Produktivprüfung fehlgeschlagen“.
- Für regionale Modelle prüft der Healthcheck den belastbaren Oberflächen-Minimalvertrag. JMA-Druckniveaus werden separat auf `jma_msm` geprüft; GSM/Seamless werden nicht mehr künstlich an den MSM-Druckniveauvertrag gekoppelt.
- Neue Regressionen schützen die Required/Optional-Trennung und den `noUnusedParameters`-Buildfehler.
- Der ältere v0.9.77.5-Buildtest wurde an die inzwischen verbindliche kombinierte Tmax/Tmin-Darstellung aus v0.9.77.7 angepasst; er erzwingt nicht mehr den obsoleten separaten `Snowflake`-Import, schützt aber weiterhin reale Lucide-Exports und die Nullability.
## CI-Hotfix nach Run #815

- Installer #815 bestand ZIP-Prüfung, `npm ci`, Dependency-Audit, TypeScript und Vite vollständig. In der automatisch erkannten Suite bestanden 617 von 618 Regressionstests.
- Der einzige Fehler lag in `scripts/test-extreme-rain-profile-night-097628.mjs`: Der Test verlangte noch die vor v0.9.77.8 gültige reine Regenmetrik ohne sichtbare I-Schwelle und außerdem den internen Variablennamen `rainTotal6`.
- Der Test schützt jetzt den verbindlichen Fachvertrag: Regen zeigt Intensitätsschwelle und tatsächliches Modellsignal gemeinsam; der RUC-Fallback prüft Quelle, echte 1-h-/6-h-Schwellen, >0,04-mm-Übernahme und maximal sechs Stunden Fenster, ohne einen bedeutungslosen lokalen Variablennamen festzuschreiben.
- Produktions-, Worker-, RUC- und 24-h-Profillogik wurden hierfür nicht zurückgerollt oder fachlich verändert.

