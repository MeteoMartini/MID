# MID v0.9.64.5

## Amtliche Warntexte

- Ein passender MeteoAlarm-Atom-Indexeintrag beendet den Abruf nicht mehr vorzeitig.
- MID lädt das verlinkte amtliche CAP-Detaildokument und zeigt dessen Beschreibung sowie vorhandene Handlungshinweise vollständig an.
- Deutsch wird bevorzugt; fehlt eine deutsche Fassung, wird der englische Originaltext angezeigt und als Englisch gekennzeichnet.
- Der MeteoAlarm-Detailabruf verwendet keinen vom CAP-Endpunkt abgelehnten speziellen `Accept`-Header. Bei einem Detailfehler bleibt der knappe Indexeintrag als sicherer Fallback erhalten.
- Kanonische Providerwahl und providerübergreifende Dublettenvermeidung bleiben unverändert.

## Plausible Niederschlagsphase

- Der zentrale Niederschlagskern prüft feste und gemischte Phasen zusätzlich gegen bodennahe Temperatur, Feuchte und angenäherte Feuchttemperatur.
- Ein Schneeschauer bei eindeutig warmer Luft wie 19 °C wird als Regenschauer ausgegeben; unplausible Schneemengen und Schneesymbole werden entfernt.
- Grenzlagen bleiben konservativ: Bei Frost oder nicht eindeutig zu warmer Feuchttemperatur bleibt der amtliche beziehungsweise modellseitige Schneecode erhalten.
- Die Prüfung wirkt gemeinsam in Stundenwerten, 15-Minuten-Daten, 7 Tagen, Widgets und der 14-Tage-Übersicht.

## Modellbeiträge pro Tag

- Die Modellzahl bezeichnet weiterhin die tatsächlich für genau diesen Gültigkeitstag auswertbaren unabhängigen Modellfamilien.
- Die Pille zeigt nun den Beitrag relativ zur höchsten aktuell verfügbaren Tagesabdeckung, beispielsweise `5/6 M` und `6/6 M`.
- Der Hilfetext erklärt, warum der bereits laufende erste Tag wegen unvollständiger Laufabdeckung weniger Beiträger haben kann als der erste vollständige Folgetag und warum die Zahl später mit den unterschiedlichen Modellreichweiten sinkt.
- Die Referenzzahl wird aus den wirklich aggregierten Modellfamilien und nicht aus einer möglicherweise Varianten enthaltenden Modellnamenliste bestimmt.

## Release

- App, Wetteraggregat, Worker und Versionsmetadaten werden gemeinsam auf v0.9.64.5 synchronisiert.
- Eine neue Regression schützt CAP-Detailabruf, englischen Fallbacktext, Warmphasen-Korrektur, Frost-Erhalt und die transparente `5/6`-Modellanzeige.
