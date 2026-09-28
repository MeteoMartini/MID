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
- Interne trockene Wettercodes 0–3 bleiben vierstufige WMO/Open-Meteo-Träger für Symbolik und Datenkompatibilität. Ihre Prozentgrenzen werden aus den gerundeten Oktas abgeleitet (0/8 → 0, 1–3/8 → 1, 4–6/8 → 2, 7–8/8 → 3), ersetzen aber **nicht** die fünf sichtbaren DWD-Textklassen. Wo Gesamtbewölkung vorhanden ist, stammt der sichtbare Text direkt aus der Oktas-Klasse.
- Die Tagesheuristiken `heavyCloudShare` und `overcastShare` sind ausschließlich Aggregationssignale für den Tagescharakter. Schwellen wie 75 % oder 90 % sind keine direkte DWD-Klassifikation eines Einzelzeitpunkts und dürfen nicht als solche beschriftet werden.

## UVI-Vertrag

Die sichtbare Kurzbezeichnung für den UV-Index ist `UVI`. Ausgeschriebene Fachbegriffe wie `UV-Index`, `UV-Schutz` oder `UV-Gefahrenindex` dürfen in Erläuterungen verwendet werden. Sichtbare Kurzwerte dürfen nicht zwischen `UV` und `UVI` wechseln.

## Regression

Pflichtregression: `scripts/test-cloud-uvi-consistency-0985109.mjs`. Zusätzlich bleiben die vorhandene aktuelle Himmelszustandsregression und die Bergwetter-Visual-Regression aktiv.
