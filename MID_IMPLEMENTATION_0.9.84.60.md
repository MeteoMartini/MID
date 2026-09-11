# MID 0.9.84.60

## Widget-Kurvenübersicht
Die Hilfslinien des Temperaturdiagramms sind im Widget etwas deutlicher. Deckkraft und Strichstärke wurden nur moderat angehoben, damit Temperaturkurve, Nachtbereiche und Niederschlag visuell führend bleiben.

## Aktuelles Wetter – Beobachtungsfusion
In Deutschland werden im Worker bereits DWD CDC 10-Minuten, DWD SYNOP/OpenData-POI und NOAA AviationWeather METAR/SPECI parallel geladen. Bright Sky wird nur verwendet, wenn der direkte DWD-SYNOP-Pfad keine Werte liefert. Optionale private/professionelle Netze bleiben nachgelagert und werden im Fast-Pass nicht benötigt.

Gefunden wurde ein relevanter Wolkenfehler: `cloud_cover_total` des DWD-SYNOP/POI-Pfads ist ein SYNOP-Gesamtbedeckungswert in Achteln. Er wurde bislang ohne explizite Achtel-Normalisierung als numerischer Prozentwert weitergereicht. Ab 0.9.84.60 werden 0–8/8 korrekt auf 0–100 % abgebildet; Code 9 wird als nicht belastbarer Gesamtbedeckungswert verworfen. Gleichzeitig wird daraus eine qualitative amtliche Himmelsbeobachtung erzeugt.

Bei deduplizierten Meldungen derselben physischen Station bleibt künftig der parameterbezogen höher gewichtete Wolkenwert führend. Eine sekundäre METAR-Wolkenklassifikation kann ihn nicht mehr nachträglich überschreiben. CAVOK bleibt weiterhin ausdrücklich keine Aussage von 0 % Gesamtbewölkung.

BUFR ist ein Transport-/Kodierungsformat. Eine zusätzliche BUFR-Decodierung derselben DWD-SYNOP-Station würde keine unabhängige Beobachtung erzeugen und darf daher nicht als zusätzlicher Messanker gewichtet werden. Entscheidend ist die physische Stationsentdopplung und die Zusammenführung der offiziellen DWD-/WMO-Beobachtungspfade.
