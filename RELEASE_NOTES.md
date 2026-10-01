# MID v0.9.85.136

## ICON-D2-Abgrenzung und konsolidierte Regressionen

- Extremwetter-Ausblick: Außenbereich der gekrümmten ICON-D2-Modellabdeckung dunkel eingefärbt; Grenzpolygon entspricht exakt der bestehenden Analyse. Dunkler Bereich in der Kartenlegende erklärt, unabhängig von Hazard-Auswahl, Zeitraum und temporären Datenlücken.
- Alle 894 Regressionen bleiben unverändert wirksam. Automatische Dateierkennung und beide Baseline-Pflichtlisten werden jetzt als vollständige identische Inventare geprüft; fehlende, veraltete und doppelte Registrierungen brechen die Suite ab.
- Ein gemeinsamer Runner meldet Fortschritt, Gesamtdauer und langsamste Prüfungen; Fehler enthalten weiter die vollständige Ausgabe. MID_REGRESSION_VERBOSE=1 zeigt auch erfolgreiche Einzelausgaben. Ausführung bleibt isoliert und seriell, damit gemeinsam verwendete Artefakte keine Rennen verursachen.
- Neue Regression schützt die identische Modellgeometrie sowie positive und negative Fälle der Testregistrierung. Keine bestehenden Assertions entfernt, keine zusätzlichen Kosten oder Datenquellen.
