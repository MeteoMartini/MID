# MID Event-Empfehlungen – verbindlicher Vertrag

Stand: v0.9.84.34

## Ziel

Event-Empfehlungen müssen Aktivität, Umgebung und meteorologische Belastung gemeinsam bewerten. Ein einzelner Lufttemperaturwert darf keine pauschale Bekleidungsempfehlung für alle Aktivitäten erzeugen.

## Bekleidung

- Aktive Sportarten (`running`, `football`, `tennis`) verwenden belastungsangepasste Sportbekleidung. Ab etwa 18 °C thermischer Referenz gilt leichte, atmungsaktive Sportkleidung; `Übergangskleidung` ist hier kein Standardtext.
- Radfahren berücksichtigt die zusätzliche Fahrtwind-Exposition und verwendet eine eigene Windschicht-Logik.
- Wandern/Klettern verwenden mehrlagige Funktionskleidung mit Reserve-Schicht bei kühleren Bedingungen.
- Golf, Stadt/Event/Konzert und allgemeine Aktivitäten verwenden eigene, weniger belastungsintensive Temperaturschwellen.
- Skifahren und Wassersport erhalten immer sportartspezifische Hinweise; die Lufttemperatur allein darf dort keine generische Alltagskleidung erzeugen.
- Indoor-Ereignisse erhalten keine aus der Außentemperatur abgeleitete Hitze-/Kältewarnung. Wetterhinweise betreffen dort grundsätzlich An- und Abreise, sofern die Tätigkeit nicht selbst wetterexponiert ist.
- Niederschlag und Wind ergänzen die Bekleidungsempfehlung aktivitätsspezifisch, z. B. Wechsel-/Pausenschicht statt pauschalem Regenschutz beim Fußball.

## Thermische Belastung

- Wärmehinweise beginnen bei intensiven Sportarten früher als bei passiven/allgemeinen Aktivitäten.
- Maßgeblich ist die thermische Eventreferenz aus gefühlter bzw. mittlerer Temperatur; für Wärme wird zusätzlich das Temperaturmaximum berücksichtigt.
- Indoor-Ereignisse werden durch Außentemperaturen nicht als thermisch kritisch klassifiziert.
- Kältehinweise berücksichtigen die Aktivität; Radfahren ist wegen Fahrtwind empfindlicher, Skifahren besitzt eigene Kälteschutzlogik.

## Datenwahrheit

- Fehlende Werte bleiben fehlend. `null`/nicht verfügbare Ereigniswahrscheinlichkeiten dürfen in der UI niemals als `0 %` erscheinen.
- Die formale Event-Niederschlagswahrscheinlichkeit aus Ensembles behält ihre strengen Qualitätskriterien (ausreichende Member-/Familienbasis und Zeitraumabdeckung). Diese Kriterien werden nicht gelockert, nur um eine Lücke zu vermeiden.
- Fehlt die Ensemble-Ereigniswahrscheinlichkeit, darf ausschließlich bei **vollständiger stündlicher PoP-Abdeckung des gesamten Eventzeitraums** ein zeitgewichtetes Stunden-PoP-Mittel als transparent bezeichnetes Ersatzsignal (`hourly-window-average-fallback`) verwendet werden. Es ist nicht mit der formalen Ensemble-Ereigniswahrscheinlichkeit gleichzusetzen.
- Fehlt auch diese vollständige Stundenabdeckung, bleibt die Ereigniswahrscheinlichkeit `unavailable`. Alle übrigen belastbaren Wetterparameter werden weiter bewertet; die fehlende PoP allein darf den Eventstatus **nicht verschärfen**.
- Änderungsmeldungen zur Niederschlagswahrscheinlichkeit werden nur zwischen zwei numerischen Werten **derselben** Wahrscheinlichkeitsquelle verglichen. Ein Wechsel Ensemble ↔ Stunden-Fallback ↔ nicht verfügbar erzeugt für sich keine Meldung „Bewertung verschärft“ oder „Niederschlagsrisiko gestiegen“.
- Ein kürzlich vollständig ermittelter Ensemble-PoP darf eine vorübergehend partielle Ensemble-Nachladung aus dem bestehenden Cache überbrücken. Dabei darf das Alter dieses Wertes nicht künstlich erneuert werden; nach Ablauf des vorhandenen Cachefensters gilt wieder Fallback oder `unavailable`.
- Eine unvollständige Datengrundlage darf nicht gleichzeitig durch scheinpräzise Nullwerte oder einen separaten Timing-Hinweis eine Entwarnung suggerieren.

## UX

Die Leitwetter-Zeile bleibt kurz und unmittelbar handlungsorientiert. Sie darf mehrere kurze, mit `·` getrennte Bausteine enthalten, aber keinen langen Fließtext erzeugen.
