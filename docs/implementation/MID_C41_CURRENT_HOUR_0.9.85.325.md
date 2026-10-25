# MID-C41 · Vollständige laufende Stunde unter Aktuell

Verifizierte Basis: v0.9.85.324, main=mid-stable=cd50ee899c8bfc38799c396a9ba38c41702e5df6.

Die 12h-Achse beginnt an der aktuellen vollen Ortsstunde, ihre Niederschlagslage
verwendete dagegen buildShortTermForecast ab now und verlor vergangene Intervalle.
Der neue buildCurrentHourPrecipitation verwendet in der laufenden Stunde die
vollständigen nativen Intervalle aus der kanonischen Stunden-/15min-Reihe. Der
aktuelle Messanker wird nicht auf die Vergangenheit projiziert. Anschließende
Intervalle werden unverändert aus dem bisherigen live angepassten Forecast
übernommen. Kurzfrist/24h bleiben bei ihrem vorhandenen Ab-jetzt-Vertrag.
Band und Quadrate unter Aktuell verwenden dieselbe vollständige Stundenreihe.
Vorhandene Roh-Endstempel und Quellen bleiben erhalten. Modellwerte werden nicht
als Stationsbeobachtung bezeichnet; keine rückwirkende neue Messung wird erzeugt.

Die Zeitumstellungsimplementierung bleibt datumsoffen: IANA-Kalendergrenzen in
Epochen, 23/25h-Tagesrekonstruktion bei vollständiger Datenabdeckung; wiederholte
Herbststunden bleiben durch Epochschlüssel getrennt. Die seit .324 verwendete
25h-Rückschau gilt für jeden Abruf, nicht nur den 25.10.2026. Neue dynamische
Gegenfälle prüfen Berlin Frühjahr/Herbst 2027 und New York März/November 2026.
Die stundenweise Anzeige prüft beide Instanzen der Herbststunde, die reale
Frühjahrslücke und Minuten 0/1/17/45/59: volle 12mm-Teststundenmenge,
unveränderte spätere Forecast-Intervalle und unveränderte Eingabedaten.

Browsermatrix erweitert um bereits verstrichenen Regen im ersten Viertel der
laufenden Stunde neben zukünftigem Regen: Band muss beide 15min-Intervalle
zeigen, Quadrate zwölf Stunden; 6 Breiten einschließlich Querformat, Light/Dark,
Classic/Next, Band/Quadrate. Bestehende Intensitäts-/Phasen-/Lücken-/Overflow-
Assertions bleiben erhalten. Physische iOS-/VoiceOver-Abnahme wird nicht behauptet.

Nur bestehender Source/Heavy → MID Release Bot → ServerZIP → Installer →
Worker/Pages → Stable. Veröffentlichung und öffentliche Identität sind nach den
Gates separat zu bestätigen. Keine Daten-/Budget-/Security-/Release-Gates gelockert.
Die Diagnose-Drafts #425/#433/#449 sind beim Start unverändert und weiterhin
unabhängig von dieser Korrektur; keine Produktionsfreigabe für ihre offenen Punkte.
