# MID 18.2.36 – v0.9.85.280: lesbare Push-Zeiten und modellgetreue Isobaren

## Basis / Verträge
- GitHub `main = mid-stable = afceb2d0b770a7f7c337cc1b9e69359dcfee19d6`, freigegebene v0.9.85.279 nach Installer #39019809930.
- Issue #392 und Screenshot mit `Regen in 59 Min.`, `Dauer 1.2 Std.`; kein Replit-Handoff und kein direkter Push auf Produktionsbranches.
- Weiterhin bindend: `MID_NOTIFICATION_RELIABILITY_CONTRACT.md`, `MID_APPLE_PUSH_BACKGROUND_CONTRACT.md`, `AGENTS.md`, Signaturen/Gates und synoptische Run-/Valid-Time-/Datenverträge.

## Umsetzung
- Nur die Push-Präsentation von Niederschlagsbeginn wird verändert: Vorlauf bis 30 min in 5-min-Stufen, oberhalb in 10-min-Stufen; 59→60 (etwa 1 Stunde), 49→50, 54→50, 24→25. Sehr kurzfristig (≤2 min) „in wenigen Minuten“. Keine fiktive Millisekundengenauigkeit.
- Dauer unter 60 min auf 5-min-Stufen, ab 60 min auf 15-min-Stufen: 72 min→„ca. 1 Stunde 15 Minuten“. Ereigniserkennung, Schwellen und Deduplikation nutzen weiter unveränderte Rohzeiten/-mengen.
- Einstellung `mid:push-time-display-mode:v1` im Benachrichtigungsbereich: `relative` (Altclient-Default) oder `absolute`. Änderungen werden direkt am vorhandenen Web-Push-Abonnement synchronisiert, ohne Neuanmeldung. Browser übermittelt nur Modus und IANA-Gerätezeitzone; pro Favorit wird die bekannte Ortszeitzone bevorzugt. Worker validiert Zone. Absolute Angaben stammen aus der bisher intern zeitregistrierten UTC-Ereigniszeit des ausgewählten Radar-/Modell-Frames; es gibt keine synthetischen Gültigkeitstermine. Mit fehlendem Event-/Zeitzonenanker wird sicher relativ dargestellt.
- Die umschaltbare Synoptik-Druckkontur stammt aus dem eigenen verifizierten `SynopticField.pressure` des ausgewählten Modells/Run/ValidTime; GFS/IFS wie ICON, soweit laut Synoptik-Katalog vorhanden. Kein Downgrade der Cloud-WW-Modelle und keine Zuordnung fremder ICON-Konturen zu GDPS/anderen Modellen. Die eigenständige persistente Synoptik-Auswahl startet absichtlich **eingeschaltet**, damit bestehende Druckkontur- und Beschriftungsfunktionen nach dem Update nicht unbemerkt verschwinden. Die übrige Modell- und Wolken-Layer-Isobarenwahl bleibt unverändert.

## Regression / Release-Abnahme
- `node scripts/test-mid280-push-time-isobars.mjs` plus sämtliche bestehenden Push-, Niederschlags-, Synoptik-, Modellkarten-, Settings-/Touch-/Responsive-, Daten-/Worker- und Release-Regressionschecks.
- Testmatrix: 24/49/54/59/74 Minuten, Dauer 15/65/72/125, alter Client, ungültige Zone, Tageswechsel, Sommer-/Winterzeit (UTC intern), Radar- und Modell-Event-Zeit, geräteweiter Cooldown und Ereignis-Deduplikation sowie GFS/IFS/ICON Isobaren ohne Run-Mixing.
- Browser-CI ist keine physische iOS-/VoiceOver-Abnahme. CI- und Deploy-Läufe erst nach Abschluss als erfolgreich melden.
- Release ausschließlich SHA-gebundener Source-PR-Gate → Bot-Merge → serverseitiges ZIP → install-mid.yml → Worker/Pages → Stable-Promotion.
