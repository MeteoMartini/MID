# MID 0.9.78.70 – Konfidenzfenster, Event-Intervallsemantik und kompakte Symbolik

Grundlage ist MID 0.9.78.69.

## 1. 14-Tage-Konfidenz widerspruchsfrei

### Befund

Seit der fachlich richtigen Trennung von meteorologischer Konfidenz und Datenqualität konnte eine Tageskachel `hoch` anzeigen, während `agreementWindows()` denselben Tag bei `dataQuality=poor` aus einem hohen Zeitfenster entfernte. Dadurch entstand die widersprüchliche Übersicht „Noch kein durchgehend hohes Konfidenzfenster“, obwohl die sichtbaren Tagesbewertungen hoch waren.

Außerdem wurde ein rein nachlaufender `unknown`-Tag durch `firstAgreementChange()` als Konfidenzabfall behandelt. Der letzte lokale Kalendertag ist aber häufig nur deshalb nicht vollständig bewertbar, weil der Ensemblehorizont nicht mehr den gesamten Kalendertag mit vollständigen Membern abdeckt.

### Umsetzung

- `agreementWindows()` bewertet das gemeinsame Fenster jetzt ausschließlich nach der meteorologischen `agreement`-Stufe. Eine schwache Datenbasis bleibt separat im Qualitätsring sichtbar und darf ein meteorologisch hohes Fenster nicht künstlich zerreißen.
- Weniger als zwei bewertbare Kernparameter bleiben weiterhin fail-closed `unknown`; unsupported Daten werden also nicht zu `hoch` hochgestuft.
- `firstAgreementChange()` ignoriert Übergänge zu/von `unknown`. Ein Abdeckungsende ist kein meteorologischer Konfidenzabfall.
- `trailingUnknownCoverageDate()` erkennt einen rein nachlaufenden, nicht bewertbaren Randbereich.
- Der letzte solche Randtag wird in der 14d-Kachel als `teilw.` statt als pauschales `offen` gekennzeichnet und im Popover als teilweise Ensembleabdeckung erklärt.
- Hohe Tageskonfidenz zeigt zusätzlich den 0–100-Konfidenzindex direkt im kompakten Badge (`hoch · 93` o. Ä.).
- Der Prognose-Kompass zeigt hohe Zeitfenster mit Indexbereich, z. B. `Sa. 05.09. – Fr. 11.09. · Index 82–95/100`.
- Der 0–100-Wert bleibt ausdrücklich **kein Prozentwert und keine Trefferwahrscheinlichkeit**. Damit bleibt die intuitive Skala der früheren Prozentdarstellung erhalten, ohne eine unkalibrierte probabilistische Aussage vorzutäuschen.
- Übersichtstexte unterscheiden explizit `Konfidenz nimmt ab` von `Datenbasis / Randtag`.

## 2. Event-Stundenkarte: Regen vs. 60 min Sonnenschein

### Ursache

Open-Meteo definiert `precipitation` und `sunshine_duration` als Summen der **vorangehenden Stunde**, `weather_code` dagegen als **Instantanwert am angegebenen Zeitpunkt**. Das bisherige Event-Timeline-Mapping nutzte den Wettercode am Stundenende als Zustandsbezeichnung für das komplette vorangegangene Intervall. Dadurch konnte beispielsweise eine trockene/sonnige Stunde 16–17 Uhr rückwirkend als `leichter Regen` bezeichnet werden, wenn der Instantan-Wettercode um 17:00 Uhr bereits Regen meldete.

### Umsetzung

- Neue reine Intervallsemantik in `src/eventIntervalSemantics.ts`.
- Für die Stundenkarte führen Niederschlagssummen/-komponenten die Niederschlagsklassifikation des vorangehenden Intervalls.
- Ein reiner Niederschlags-Wettercode am Intervallende darf ohne Niederschlagsmenge im Intervall nicht rückwirkend die ganze Stunde als Regen klassifizieren.
- Bei trockenem Intervall wird der repräsentative Himmelszustand aus Sonnenscheindauer und Bewölkung abgeleitet; vorhandene nicht-niederschlagsbezogene Wettercodes bleiben Fallback.
- Sonnenscheindauer wird zusätzlich durch den bestehenden appweiten physikalischen Kohärenzfilter geführt.
- Event-Hilfe erläutert nun explizit die unterschiedliche Zeitsemantik von Akkumulationen und Instantan-Wettercode.

## 3. Appweiter Symbol-/Platz-Audit

Alle sichtbaren TSX-Oberflächen wurden auf wiederholte Begriffe geprüft. Häufige Kandidaten sind u. a. Temperatur, Niederschlag, Wind/Böen, Sonnenschein, Sicht, Luftdruck, Bewölkung und Wolkenuntergrenze.

Verbindlicher Grundsatz: Icon-only nur dort, wo die Semantik ohne Mehrdeutigkeit erhalten bleibt; Einheit und zugängliche Textbezeichnung bleiben bestehen.

Umgesetzt:

- 14d-Tageskarten: die wiederholten sichtbaren Kurzlabels `Temp`, `Niederschlag` und `Wind` entfallen; Thermometer-, Tropfen- und Windsymbol tragen `title`/`aria-label`/`sr-only`.
- Event-Stundenkarten: untere Zeile nutzt Wind- und Sonnensymbol statt der wiederholten Wörter `Wind`/`Sonnenschein`.
- Event-Kurzwerte: redundante ausgeschriebene Sonnenscheinbezeichnung neben eindeutiger Sonnensymbolik reduziert.
- Widget: redundante zweite Textzeile `Sonnenscheindauer` unter `☀ + h` entfernt; zugängliche Bezeichnung bleibt erhalten.

Bewusst **nicht** auf Icon-only reduziert werden Achsentitel, Warn-/Gefahrentexte, komplexe Luftfahrtbegriffe, Datenqualität, Modellstand, Sicht/Wolkenuntergrenze und andere ohne Kontext mehrdeutige Größen.

Der verbindliche Vertrag ist in `MID_COMPACT_SYMBOL_CONTRACT.md` dokumentiert.

## Worker

Keine fachliche Workeränderung. Nur normale Versionssynchronisierung.
