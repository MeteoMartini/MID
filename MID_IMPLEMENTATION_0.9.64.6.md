# MID v0.9.64.6

## Griechenland: amtliche Warnung für Stegna/Rhodos

- Der Ausfall war reproduzierbar: Bei gespeicherten oder per GPS ermittelten Orten kann `admin2` fehlen. Ohne den Textwert „Dodekanes“ verwarf der bisherige Ortsnamensabgleich die amtliche Warnung für **Dodekanisa Islands**, obwohl Stegna innerhalb des Warngebiets liegt.
- MID fragt für MeteoAlarm-Länder nun zusätzlich die amtlichen Live-Warngebiete ab und ordnet sie dem Standort über dessen Koordinaten zu. Für Stegna trifft die veröffentlichte Dodekanes-Gebietsbox zu; die Box „North East Aegean Islands“ trifft nicht zu.
- Der Live-Gebietsabgleich dient nur der Standortzuordnung. Meldung, Gültigkeit, Warnstufe, Absender und vollständiger Text stammen weiterhin aus dem kanonischen MeteoAlarm-/nationalen Wetterdienstpfad.
- Der verlinkte Atom/CAP-Datensatz wird weiterhin bevorzugt. Fehlt oder scheitert das CAP-Detail, liefert der amtliche MeteoAlarm-Live-Datensatz denselben Warnungstext als Fallback.
- Für Griechenland wird bei fehlender deutscher Fassung der vollständige englische Originaltext des HNMS einschließlich „BE AWARE“ angezeigt.
- MeteoAlarm-Warnungskennung und CAP-Linkkennung werden gemeinsam dedupliziert. Live-Datensatz und Atom/CAP erscheinen deshalb nicht doppelt.
- Allgemeine Richtungswörter sowie „Aegean/Ägäis“ reichen nicht mehr aus, um ein fremdes Nachbargebiet zuzuordnen.

## Cloudflare-KV

- Das im Screenshot gemeldete Tageslimit von 1.000 KV-`put`-Vorgängen erklärt die fehlende interaktive Griechenland-Warnung **nicht**: Die Route für amtliche Warnungen verwendet kein Workers-KV, sondern liest MeteoAlarm direkt.
- Bis zum täglichen Reset können jedoch schreibende Funktionen der gemeinsamen KV-Bindung betroffen sein, insbesondere Push-Registrierung und Push-Zustände, Wetterzwilling-Synchronisation/-Archiv sowie Netatmo-Verbindungsdaten.
- Die bereits vorhandene Scheduler-Budgetierung bleibt erhalten: KV-Einträge werden nur bei Zustandsänderung oder Migration geschrieben, Prüfklassen laufen in abgestuften Intervallen und der Heartbeat wird gedrosselt. Für den Warnungsabruf wird keine neue KV-Abhängigkeit eingeführt.

## Regression und Release

- Eine neue Regression bildet Stegna ohne `admin2`, zwei ähnlich benannte Ägäis-Warngebiete, den englischen HNMS-Volltext, die CAP-/Live-Deduplizierung und die KV-Isolation der Warnroute nach.
- App, Wetteraggregat, Worker und Versionsmetadaten werden gemeinsam auf **0.9.64.6** synchronisiert.
- Da die Korrektur im Worker liegt, muss der neue Worker zusammen mit der Professional-App ausgerollt werden.
