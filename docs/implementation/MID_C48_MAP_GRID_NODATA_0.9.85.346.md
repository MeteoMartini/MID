# MID-C48 · Lokales ICON-D2-Kartenraster

Basis veröffentlichte .345 afc0fcbde19ca468ecd2d3701cba5a750713b4ca. Keine Änderung der Abdeckung oder produktive Freigabe von #449/#433/#480.

Befund: weatherMapGridData ersetzte fehlende weather_code/precipitation/snowfall durch0, rundete Wettercodes und Niederschlagsmengen vor dem Transport und indexierte alle Punktreihen mit der Achse des ersten Punktes ohne Zeitabgleich. Der Renderer rundete Wettercodes nochmals. Dies konnte NoData als trocken/kein Signal ausgeben und verschobene Punktachsen unter falscher Gültigkeitszeit darstellen.

Korrektur: Nur endliche numerische Quellwerte mit identischem gültigem Zeitstempel am Zielindex sind verwendbar. Kein Nearest-Time-Matching oder Interpolieren. Fehlende, boolesche, nichtnumerische und zeitlich unpassende Werte bleiben NaN intern/null im JSON; negative Mengen und fraktionale/außerhalb0..99 liegende Wettercodes werden verworfen. Echte0 bleibt0. Vorzeitige Mengenrundung entfällt; die bestehende gemeinsame Werteformatierung bleibt die Anzeigegrenze. Datenverfügbarkeit85% für Druck, Fachschwellen, Farbtabellen, Rastergröße9×11 und Modellkandidaten bleiben unverändert.

WeatherMapGridFrame beschreibt nullable Felder ausdrücklich. Tatsächlicher GeoJSON-Renderer überspringt Missing und ungültige Wettercodes; keine Null-Geometrie und kein NaN-Label. Gültige positive Extreme bleiben ohne Glättung und ohne Mengenobergrenze erhalten. Keine neue Prognosegüte, kein neuer Modellkonsens.

Der bestehende verpflichtende Wetterkarten-Modultest führt die neue echte Worker-/JSON-/Rendererprüfung aus: null,0,negative Werte, Boolesche, Strings, fraktionale/ungültige Wettercodes, hohe endliche Werte und Nachkommengenauigkeit; abweichende Punktzeiten und unverändert fail-closed abgelehnte Druckabdeckung. Der tatsächliche Renderer wird an der React/MapLibre-Grenze ausgeführt und dessen GeoJSON auf fehlende/geprüfte Werte untersucht. Dies ist kein realer Browser-/iOS-Nachweis; die vollständigen Source-/Heavy-/Installer-Gates bleiben verbindlich.

Die explizit als GMT angefragten ISO-Zeiten ohne Offset werden ausschließlich in diesem Kartenpfad als UTC interpretiert; vorhandene explizite Offsets bleiben erhalten. Derselbe Worker-/Renderer-Test läuft zusätzlich unter TZ=Europe/Berlin. Kein globaler Datumsparserwechsel.

Lokale Endprüfung: Produktionsbuild/Types erfolgreich; Produktionsaudit0 Vulnerabilities; alle1028 Regressionen ohne Fehler in151.9s. Neuer Worker-/JSON-/Rendererfall außerdem unter UTC und Europe/Berlin erfolgreich. CI-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates stehen für den neuen Kandidaten noch aus. Keine physische Geräteabnahme behauptet.

## Modellstand: Teilverifikation statt scheinbar fehlender Anzeige
Der Nutzerscreenshot belegt12 aktuelle und6 nicht verifizierbare Einträge, nicht fehlende Prognosedaten. Die bisherige Gesamtlogik ließ einen einzigen unbekannten Eintrag alle aktuellen Nachweise grau erscheinen. Best Match ist keine einzelne Modellinitialisierung und wird deshalb getrennt von der Einzelmodell-Zeitbewertung erläutert; die kanonische Prognoseverwendung bleibt unverändert.

Neuer Teilstatus partial (blau) bei aktuellen Einzelmodellen plus unbekannten Nachweisen; vollständig unbekannte Einzelmodelle bleiben grau/gestrichelt. Gelb/Rot für tatsächlich verzögerte/überfällige Einzelmodelle hat Vorrang. Grün erfordert nach wie vor vollständig aktuelle bewertete Einzelmodelle. Der Trigger zeigt verifizierte/gesamt Einzelmodelle. Die Detailanzeige benennt die Modelle ohne vollständigen Zeitnachweis und weist Best Match separat aus. Kein Verstecken unbekannter Einzelmodelle, keine fiktiven Zeiten und keine neue meteorologische Gewichtung.

Eine repräsentative Live-Diagnose des produktiven forecast-fusion-Endpunkts am27.10.2026 lieferte Best Match ohne Init, mehrere erfolgreiche beitragende Modelle ohne Laufmetadaten und konkrete aktuelle RUC-Läufe. Dies ist keine Rekonstruktion des exakten Nutzerstandorts oder der sechs damaligen Einträge. Der Screenshotfall wird synthetisch als12 aktuelle +5 unbekannte Einzelmodelle +1 Sammelquelle geprüft; alte Läufe, unbekannte-only und nicht verwendete Kandidaten behalten ihre Schutzregeln.

Endprüfung einschließlich ergänzter Modellstandanzeige: erneut1028/1028 lokale Regressionen ohne Fehler (286.5s); neue Grenzfälle zusätzlich gezielt erfolgreich. Build/Types erfolgreich. Die frühere Angabe151.9s bezeichnet den bereits bestandenen Kartenstand vor Ergänzung der Modellstandanzeige. Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Freigabe noch ausstehend.
