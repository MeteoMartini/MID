# MID v0.9.85.361

## Robuste, sichere Fehlerdiagnosen

- Widget- und Browser-Erstfehlerberichte bleiben jetzt auch dann als gültiges JSON erhalten, wenn die eigentliche Diagnoseerfassung fehlschlägt oder einen nicht serialisierbaren Wert liefert.
- Nur der erste Schreibversuch reserviert den Bericht exklusiv. Ein lesbarer Zwischenstatus und ein vollständig vorbereiteter, atomar veröffentlichter Endbericht verhindern beschädigte oder leere Diagnosedateien bei asynchronen Fehlern.
- Neue Regressionstests prüfen parallele Schreibzugriffe, den laufenden ersten Collector, zyklische/fehlende Daten, nicht offengelegte Fehlermeldungen, private Dateirechte, Symlinks und die Konsistenz zu Screenshot-/Timing-Artefakten.
- Die bestehende WebKit-/Chromium-CSS-Paritätsprüfung unterscheidet jetzt stabile Endgeometrie von noch nachlaufenden Browser-Renderframes und meldet bei anhaltenden Abweichungen das konkrete erste DOM-Element. Die vollständige Pixel- und Layout-Parität bleibt Pflicht.
- Wetterberechnung, amtliche Warnungen, Datenquellen, Widgetvarianten, Browsermatrizen und die Release-Sicherheitsgates bleiben unverändert.

Die historische Ursache einzelner Widget-Timeouts und der Status individueller CodeQL-Alerts werden dadurch nicht automatisch als geklärt gewertet. Erst vollständiger Source-PR-Gate, SHA-gebundener Release-Bot, neues Server-ZIP, Installer, Worker/Pages und Stable-Promotion bestätigen die Veröffentlichung. Keine physische iOS-/VoiceOver-Abnahme aus CI abgeleitet.
