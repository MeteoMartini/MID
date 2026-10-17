# MID 18.2.38 · Push-Präferenzen und Bestätigung · Kandidat .286

Isolierte Vorbereitung von #400 auf freigegebener .284
`16b6c87906370b62315e0046dec64506304abcc4`. Vor einem Source-PR zwingend
frisch veröffentlichtes .285 integrieren und alle Versionsspiegel synchronisieren.
Dieser Arbeitsstand ist weder freigegeben noch veröffentlicht.

## Reproduktion und Änderungen

Die echte .284-Clientquelle wurde mit verzögertem ersten Registrierungs-POST
und nachfolgendem absoluten POST ausgeführt: POST-Reihenfolge relative/absolute,
lokale Auswahl absolute, finaler Serverstand relative. Der Race ist damit
reproduziert, unabhängig von einer echten Gerätebenachrichtigung.

Registrierungsmutationen derselben Seite laufen nun in Aufrufreihenfolge; eine
fehlgeschlagene Operation blockiert folgende nicht. Die aktuelle Zeitanzeige wird
erst unmittelbar vor dem tatsächlichen POST gelesen. Nach einem POST werden
mindestens 1,1 Sekunden bis zum nächsten Registrierungs-POST eingehalten, entsprechend
dem KV-Limit von einem Write pro Sekunde und Schlüssel. Die Freigabeabfrage startet
bei Aktivierung weiter unmittelbar im Nutzeraufruf; sie wird nicht hinter eine
Warteschlange verschoben.

Worker-Antwort und Status enthalten den normalisierten akzeptierten Modus und die
Gerätezeitzone. Ohne positive Bestätigung der konkreten Auswahl darf der Client
keinen Erfolg melden. Die Oberfläche unterscheidet lokal gespeichert, Übertragung
ausstehend, serverseitig bestätigt und ein noch nicht aktives Geräteabo. Veraltete
Antworten älterer Auswahlen und Statusabfragen überschreiben die aktuelle Auswahl
nicht. Nach bestätigtem POST, aber noch abweichender Statusantwort bleibt die UI
explizit auf „Statusbestätigung ausstehend“ statt widersprüchlich Erfolg zu melden. Fehlgeschlagenes
lokales Speichern wird ausdrücklich als Fehler angezeigt und nicht als übertragene Auswahl.

Scheduler und Testmitteilung lesen die Registrierung vor Runtime-Rückschreibungen
erneut; ihre Werte übernehmen die neueste lesbare Konfiguration, erhalten neuere
Sendezeitpunkte und überschreiben bei zwischenzeitlichem Regelwechsel keinen
neueren Regelzustand. Fehlende Einträge werden nicht wiederhergestellt. Vor jedem
Benachrichtigungstrigger wird geprüft, ob die gelesene Registrierung noch passt;
veraltete Auswertungen brechen ab. WMO-/DWD-Fachlogik, Niederschlagsereignisse,
relative/absolute UTC-/IANA-Zeitformatierung und Sperrintervalle bleiben erhalten.

## Belege und Grenzen

`test-push-settings-ordering-0985286.mjs` enthält echte gebündelte Clientquelle,
verzögerten älteren POST, neuere Auswahl, Queue-Fehlererholung, fehlendes Abo,
fehlende Serverbestätigung, neuesten lesbaren Workerzustand, Schutz gegen
Wiederherstellung eines abgemeldeten Geräts und eine tatsächlich suspendierte
Scheduler-Auswertung während eines Regelwechsels. Bestehende .280-Zeit-/DST-Tests,
Push-Reliability, Types und Aggregatprüfung bleiben Pflicht.
`test-push-settings-browser-0985286.mjs` bereitet außerdem die echte React-Oberfläche
mit kontrollierter Push-Grenze für 320/390/844/768/1024/1440px in Hell/Dunkel vor:
Overflow,44px-Touch-/Hit-Ziel, out-of-order UI-Bestätigung, kein Abo und lokaler
Speicherfehler. Lokal wegen fehlendem Chromium ausdrücklich SKIP (nicht bestanden
behauptet); CI verlangt Chromium und muss diese Matrix tatsächlich ausführen.

Cloudflare-Primärdokumentation via Context7: KV ist eventual consistent und bietet
keinen atomaren Compare-and-Swap. Der erneute Read ist daher keine globale
Atomaritätsgarantie über mehrere Regionen/Tabs; eine neue Präferenz kann erst nach
KV-Propagation in einer anderen Region sichtbar werden. Keine neue Datenbank,
Durable-Object-Bindung, Berechtigung oder kostenpflichtige Infrastruktur eingeführt.
Kein physischer iOS-/Push-/VoiceOver-Nachweis. Source-/Installer-/Worker-/Pages-/Stable-
Gates müssen am finalen Kopf vollständig erfolgreich sein.
