# MID v0.9.32.1

## 24-h-Wetterprofil: Thermik und Hazards präzisiert

- **Schwüle** ersetzt die separate Feuchte-Zeile in den Einzeldaten. Die Kennzeichnung ist bewusst transparent und nutzt die vereinfachte DWD-Schwülegrenze **Taupunkt ≥ 17 °C** (entspricht ungefähr **18,8 hPa Dampfdruck**), da der vollständige DWD-Schwüleindex des Klima-Michel-Modells nicht als Datenfeld vorliegt.
- Die bisherige Zusatzformulierung **„prägend: …“** beim thermischen Empfinden entfällt vollständig.
- Die thermische Einordnung selbst bleibt unverändert auf den DWD-Klassen der Gefühlten Temperatur.
- Die Hazard-Logik wurde sprachlich und fachlich entkoppelt: unterhalb einer relevanten Schwelle wird nicht mehr ein zufälliger „dominanter“ Parameter wie Niederschlag oder Gewitter zusammen mit „ruhig“ ausgegeben, sondern eindeutig **„keine signifikanten Wettergefahren“**.
- **Gewitterrisiko** und **Nebelrisiko/Sichteinschränkung** werden bei relevanten Signalen ausdrücklich benannt. Das Gewitterfeld unterscheidet zwischen quantifizierter Wahrscheinlichkeit und einem reinen Gewittersignal aus dem Wettercode.
- Gewöhnlicher leichter Regen wird nicht mehr allein aufgrund seines Wettercodes als Hazard hochgestuft. Als Niederschlags-Hazards verbleiben insbesondere gefrierender/winterlicher Niederschlag sowie kräftige bis starke stündliche Niederschlagsraten.
- Die 24-h-Signalkachel **„Feuchte / Nebel“** wurde zu **„Nebelrisiko“** präzisiert; **„Max. Belastung“** heißt jetzt **„Max. Wetter-Hazard“**.

## Layout und Wolken

- Vertikale Abstände oberhalb des Diagramms und zwischen Diagramm/Legende reduziert; die Profilhöhe wurde leicht komprimiert, ohne Spuren oder Achsen abzuschneiden.
- Wolkenschichten H/M/L mit etwas höherem Grundkontrast und leicht verstärkter Kontur dargestellt; Fading und meteorologisch richtige Reihenfolge bleiben erhalten.

## Regression

- Neue Regression `scripts/test-mid-weather-profile-thermal-hazards-09321.mjs` schützt Schwüle, Hazard-Klarheit, Entfernung der Feuchte-/„prägend“-Zeile, kompaktere Abstände und den erhöhten Wolkenkontrast.
- Die v0.9.32.0-Regressionsprüfung wurde nur dort auf den neuen Sollzustand synchronisiert, wo bewusst ersetzte Formulierungen geprüft wurden.

## Worker

Keine funktionale Worker-Änderung. Der Worker wird ausschließlich auf die Releaseversion synchronisiert.

## Verifikation

- 327/327 automatisch erkannte MID-Regressionstests bestanden.
- Nach der abschließenden Theme-Kontrastnachschärfung wurden die neue v0.9.32.1-Regression und die TypeScript-Syntaxprüfung erneut ausgeführt.
- 87 TypeScript-/TSX-Dateien ohne Parserfehler.
- Worker und beide Service Worker mit `node --check` geprüft.
- `npm ci --ignore-scripts` kann in der isolierten Umgebung weiterhin nicht abgeschlossen werden, weil der interne npm-Registry-Mirror `yallist-3.1.1.tgz` mit HTTP 404 beantwortet; dadurch ist hier kein vollständiger Vite-Produktionsbuild möglich.
