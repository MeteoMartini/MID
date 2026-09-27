# MID v0.9.85.109 – Bewölkungs- und UVI-Konsistenz

## Anlass

Die aktuelle Wetterübersicht konnte einen trockenen Best-Match-Wettercode wie „Bedeckt“ anzeigen, während die daneben sichtbare Gesamtbewölkung aus einem anderen Datenpfad beispielsweise 6/8 ergab. Zusätzlich waren direkte Oktas-Bezeichnungen und die Kurzbezeichnung des UV-Index nicht überall einheitlich.

## Verbindlicher Bewölkungsvertrag

- Direkte Oktas-Texte folgen dem DWD: 0/8 wolkenlos; 1–3/8 leicht bewölkt bzw. tagsüber heiter; 4–6/8 wolkig; 7/8 stark bewölkt; 8/8 bedeckt.
- Im aktuellen trockenen Wetter werden Haupttext, Piktogramm und Bewölkungskarte aus derselben kanonischen Oktas-Klasse abgeleitet.
- Liegt keine frische lokale Wolkenmessung vor, wird der trockene Modell-Wettercode mit der tatsächlich dargestellten Gesamtbewölkung reconciliiert.
- Niederschlag sowie belastbare Sicht-/Nebelphänomene behalten fachlich Vorrang vor einer reinen Bewölkungsbeschreibung.
- Für kontinuierlich hyperlokal analysierte Prozentwerte bleibt 8/8 vollständiger Bedeckung von 100 % vorbehalten; diskrete amtliche Beobachtungen werden nicht umgedeutet.
- Klima- und direkte Bewölkungslegenden verwenden dieselben DWD-Klassen.

## UVI-Vertrag

Die sichtbare Kurzbezeichnung für den UV-Index ist `UVI`. Ausgeschriebene Fachbegriffe wie `UV-Index`, `UV-Schutz` oder `UV-Gefahrenindex` dürfen in Erläuterungen verwendet werden. Sichtbare Kurzwerte dürfen nicht zwischen `UV` und `UVI` wechseln.

## Regression

Pflichtregression: `scripts/test-cloud-uvi-consistency-0985109.mjs`. Zusätzlich bleiben die vorhandene aktuelle Himmelszustandsregression und die Bergwetter-Visual-Regression aktiv.
