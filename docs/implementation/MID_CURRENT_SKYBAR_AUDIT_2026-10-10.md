# MID 0.9.85.230: Skybar Aktuelles / Heute

## Befund und Basis

Verifizierte Basis: `main=mid-stable b88efe2f3ba580aad5a0e692037f2c9814f69547`, Release .229. Source-Gate 38059167998 und Installer 38059674163 erfolgreich, einschließlich Worker, Pages und Stable-Finalisierung. Offene PRs #260/#253/#252 betreffen Dependencies; keine überlappende Source-Änderung.

Die Screenshots zeigen ein fehlendes Regensignal im 12h-Streifen unter Aktuelles, während Nowcast und Heute Regen am frühen Abend darstellen. Der genaue historische Standort-/Radar-Datensatz ist nicht archiviert; eine identische historische Wetterrekonstruktion wird nicht behauptet.

Der Codebefund ist reproduzierbar: Current übergab nur `currentThreadSeries.slice(0,12)` an den Skybar-Renderer. Die kanonische Viertelstundenreihe fehlte. Außerdem wurden endgestempelte Stundenmengen unmittelbar in vorwärts gerichtete Streifenslots übernommen. Die Regression liefert trockene grobe Stunden und eine positive native Viertelstundenmenge von 0,06 mm: der alte Pfad zeichnet keinen Niederschlag.

## Änderung

Current erhält `displayMinutes15` und `shortTermAnchor`, wie Heute. `buildShortTermForecast` erstellt die bereits finalisierte Kurzfrist-Präsentation; es wird kein Radar-Nowcast erneut eingeblendet. `shortTermProfileHourlyPoints` wird als bestehende gemeinsame Funktion wiederverwendet, ohne ihre meteorologische Rechnung zu ändern. Band-Grundzustände und Stundenquadrate folgen derselben Stundenaufbereitung wie Heute; das Niederschlagsband erhält die feineren Kurzfristintervalle.

Der gemeinsame `detailSkyBarTimedSegments` verwendet explizite Start-/End-Epochen. Current und Heute teilen diesen Niederschlagsrenderer. Clipping verändert nur die sichtbare Geometrie, niemals die ursprüngliche Menge oder Dauer zur Intensitätsberechnung. Fehlende oder ungültige Intervalle werden nicht verlängert. Farben, Phasen und Dickenstufen kommen unverändert aus `detailSkyBarSegments`.

Die Current-Temperaturachse bleibt auf der letzten vollen lokalen Stunde verankert, inklusive exakt +12h-Differenz. Der Vorhersagestreifen beginnt ab jetzt; der bereits vergangene Teil der ersten Stunde wird nicht als zukünftiges Wetter erfunden. Stundenquadrate verwenden echte Epoch-Positionen. Die laufende Zeitbasis wird wie im Heute-Profil spätestens alle 30 Sekunden erneuert, weiterhin auch an Sonnenereignissen und beim Wiederöffnen.

## Prüfung und Reproduktion

- `node scripts/test-current-skybar-canonical-0985230.mjs`: alter Verlust reproduziert; Current/Heute-Parität für Start, Ende, Farbe, Phase, Intensität und Stundenquadrate; trockene Null, fehlende Feindaten, ungültige Intervalle, echte Lücken, Rand-Clipping und unveränderte Inputs.
- `node scripts/verify-current-skybar-browser-0985230.mjs`: echte Current-/ShortTermRibbon-Komponenten mit Produktions-CSS, 48 Kombinationen aus 320/390/412/844/1024/1440 px, hell/dunkel, Classic/Next und Band/Squares. 844 px wird mit 390 px Höhe als Querformat geprüft. Positiver 15-Minuten-Niederschlag bleibt sichtbar und zeitlich korrekt; gleiche Beschreibungen und kein Seitenüberlauf. Wird in GitHub Actions verpflichtend vom Regressionstest aufgerufen.
- `npm run build`, `npm run test:regressions`, `node --check worker/metar-proxy.js`: normale bestehende Gates. Sauberes Haupt-JS 1.424.342 B bei unverändertem 1.500.000-Budget; CSS 1.752.171 B bei 1.760.000-Budget.

Die erste lokale Gesamtprüfung kollidierte mit einem gleichzeitig erneuerten `dist`-Ordner; mehrere Buildgenerationen wurden summiert. Danach Build und Gesamtprüfung strikt nacheinander. Stale Import-/Props-Textanker wurden durch kompatible Anordnung erhalten. Der C23-Test exportiert den nun regulär exportierten Stundenhelper nicht noch einmal künstlich; der Squares-Test folgt der präzisierten Ab-jetzt-Beschriftung. Fachliche Assertions und Budgets wurden nicht abgeschwächt.

Veröffentlichung ausschließlich über Source-PR, bestehende MID Agent Source Release und `install-mid.yml`. Deployment-/Stable-Nachweise werden nach Abschluss in der PR dokumentiert. Der Gesamtaudit aus .229 bleibt offen; diese Änderung schließt den beschriebenen Skybar-Konsistenzbefund.
