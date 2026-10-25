# MID-C45: Fusionsabruf / fehlendes Eingeflossen

## Befund
Stable .333: einmaliger, verzögert geplanter Effect beendet sich bei hidden/offline ohne eigene Wiederaufnahme. loadForecastFusion kann bei Abruffehler ohne Cache null liefern. Der Effect hat keinen Retry. Ohne fusion.sources gibt die Modellliste allgemeine Verfügbarkeitsmetadaten zurück; usedInCanonical fehlt und Eingeflossen wird korrekt nicht behauptet. Live-Abfrage für Rheidt zeigte eine aktive v9-Fusion mit tatsächlichen RUC/RUC-EPS-Übernahmen (13 h). Der konkrete Gerätepfad ist damit noch nicht reproduziert, der ausfallsichere Lifecycle-Pfad aber im Quellcode nachweisbar.

## Änderung
Controller mit einem Timer/einem aktiven Request, 5/15/60 s Retry und fünf Minuten Regelabstand; vorhandene Cachefristen bleiben maßgeblich. Sichtbarkeit, online, pageshow und MID-Runtime-Resume holen den Abruf nach. Cleanup abortiert und verhindert verspätete Ergebnisübernahme; hidden/offline startet keinen Request. Ohne Fusionsnachweis benennt die Modellliste diesen Zustand ausdrücklich. Keine Änderung an Wetter-, NoData-, Ensemble-, RUC-, Worker- oder Releaseverträgen.

## Validierung
Deterministische Ausführung des echten Controllers mit Timer-/Netz-/Visibility-Fixture: hidden/offline initial und Rückkehr, null/Timeout mit Backoff, echte Nutzungsmetadaten unverändert, doppelte Resume-Ereignisse, in-flight Koaleszierung, Abort/verspätete Antwort nach Cleanup und maximale Retryrate. Bestehende Quellenstatus-, Runtime-, Typ-/Build-/Release-Gates separat ausführen. Keine reale iOS-/VoiceOver-Abnahme.

## Weiterer Befund
Ein Live-GEM-Quellenstatus enthielt Mai-Initialisierung bei erfolgreich gemeldeten numerischen Forecastdaten; die Bindung von Metadaten an verwendete Felder ist gesondert zu untersuchen. Dieser Client-Lifecycle-Fix gibt darüber keine fachliche Freigabe.

## Bestehender Versionsfehler
Der Popup-Test .333 bindet das gesamte Paket auf exakt die Einführungsversion .333 und blockiert dadurch jeden späteren Wartungsstand, bereits den parallelen Logo-PR #472. Die Assertion wird auf synchrones package/baseline plus Mindestversion .333 korrigiert; sämtliche Popup-, Theme-, Touch- und CSS-Assertions bleiben bestehen.

## Lokaler Prüfnachweis
1019 Core-Prüfungen ausgeführt: 1017 initial erfolgreich, zwei Python-RUC-Prüfungen wegen fehlender Executor-Dependencies rot; nach Installation der kanonischen requirements-pages.txt beide unverändert erfolgreich wiederholt. Controller-/Cockpitadapter-Regression nach letzter Ergänzung erfolgreich. Typprüfung, Produktionsbuild, bestehender Runtime-/Modellstatus-/Startupvertrag, Performancebudget, Versionsspiegel und Release-Lineage erfolgreich. Initiales CSS bleibt 1.759.985 Bytes. Keine Browsermatrix oder physische Geräteabnahme lokal behauptet; vollständige Source-/Heavy-/Installer-Gates bleiben erforderlich.
