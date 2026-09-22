# MID v0.9.85.84 · MID 18.2.5 · Arbeitspaket F

## Map-first für Radar, Satellit, Komposit, Modellkarten und Synoptik

Arbeitspaket F führt die Kartenbereiche als gemeinsame MID-Arbeitsfamilie zusammen. Die Karte erhält deutlich mehr visuelles Gewicht; Layerwahl, Zeitsteuerung, Wiedergabe, Zeitpunkt, „Jetzt“, Deckkraft und Quelleninformationen werden als ruhige Instrumentenbänder um die Karte angeordnet statt die meteorologische Fläche zu überdecken.

Die bestehende Radar-/Satellit-/Komposit-Zeitlogik bleibt unverändert: Die Zeitachse verwendet ausschließlich tatsächlich bestätigte Produktstände und unterscheidet Beobachtung, Nowcast und Modellprognose. Play/Pause, Bildtempo und Rückkehr zum aktuellen Stand bleiben erhalten. Hochauflösendes 250-m-Radar und die amtliche Warnkarte bleiben Live-only.

Deckkraftwerte bleiben fachlich je Layer getrennt und persistent. Die gemeinsame Gestaltung vereinheitlicht lediglich die Bedienform. DWD-Modellkarten behalten ihre vorhandene produktbezogene Deckkraft und ihre eigene bestätigte Terminliste.

Die eigenständige Synoptik erhält keine künstliche Playback-Zeitachse und keinen funktionslosen Transparenzregler. Interaktive MID-Synoptik mit Isobaren, Druckzentren, Stationsplots und objektiven Modellfronten wird innerhalb der Synoptik vor der amtlichen DWD-Referenzkarte priorisiert; das DWD-Original bleibt unverändert und klar als Referenz gekennzeichnet.

Die neue Designschicht schützt Smartphone hoch/quer, Tablet hoch/quer und Desktop vor horizontalem Seitenoverflow, hält Kartenstatus und Overlays an den Rändern und berücksichtigt Safe Areas sowie die bestehende Bottom-Bar. Replit hat den F-Entwurf einschließlich Typecheck, Produktionsbuild, fokussierter Regression und Light/Dark auf 360×800, 390×844, 430×932, 834×1112, 1112×834 und 1440×900 abgenommen.

Unverändert bleiben meteorologische Datenquellen, Radar-/Satelliten-/Komposit-Fachlogik, Zeitauflösungen, Farbskalen, Isobaren/Isohypsen, Fronten, Warn-/Hazard-Daten und die unabhängige Skybar-/Stundenquadrat-Auswahl.
