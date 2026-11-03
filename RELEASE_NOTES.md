# MID v0.9.85.415 – schnelleres Webpaket und fachlich saubere Schneefallgrenzen

- **Schlankere Webauslieferung:** Zwei für iOS vorgesehene 1024-Pixel-App-Icons entfallen aus dem Web-Build nur dann, wenn keine Webansicht und kein Webmanifest darauf verweist. Alle iOS-Originalbilder, die PWA-Icons in 192 und 512 Pixeln, Logos, Light/Dark und Favoriten bleiben erhalten. Die bestehenden Web-Budgets werden nicht erhöht.
- **Bergwetter ohne Sommerzeitverschiebung:** Das separate Schneefallgrenzen-Ensemble verwendet echte Unix-UTC-Zeitpunkte des Modellanbieters und stellt sie anschließend in der Ortszeitzone dar, statt einen konstanten Antwortoffset zu raten.
- **Unsicherheit korrekt kenntlich:** Fehlende Ensemble-Streuung ist kein 0-m-Unschärfeband. Das Diagramm zeigt vorhandene Mittelwerte weiterhin, aber fehlende Quantile ausdrücklich als Datenlücken; eine belegte echte Nullstreuung bleibt Null.
- **Zusätzliche Qualitätssicherung:** Echte Web-Build-Referenzen vor der Assetreduktion, Fallbacks, 23-/25-Stunden-Zeitwechsel, fehlende Streuungsparameter und die vollständigen neuen 7-/14-Tage-Ansichten werden zusätzlich auf Regressionen geprüft.

DWD-Warnungen, Datenquellen und ihre amtlichen Gültigkeiten sowie die bestehenden 27-Stunden-RUC-/EPS-Produktionswege werden nicht umgestellt. Native ICON-D2-/Fast-/20-EPS-Vollgebietsfreigaben und echte iOS-/VoiceOver-Gerätetests sind weiterhin eigenständige Prüfungen.
