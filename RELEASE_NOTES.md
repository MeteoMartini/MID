# MID v0.9.85.268 · Skybar bei kurzer Sonnenscheindauer konsistent

- Bekannte geringe Tagesbewölkung verschwindet nicht mehr aus der Skybar, wenn die Sonnenscheindauer innerhalb eines Intervalls kurz ist, etwa bei Sonnenauf- oder -untergang. Das gelbe Band bezeichnet dann ausdrücklich Wolkenlücken, nicht gemessene Sonnenscheindauer.
- Die gemeinsame Korrektur erreicht auch Tagesansichten, Widgets und Exporte. Graue Bewölkung, klare Nächte, Niederschlag und echte Datenlücken bleiben erhalten.
- Die inzwischen veröffentlichte vollständige RUC-Kompression bleibt unverändert; zusätzliche Wetterfelder oder Termine werden mit diesem Update nicht aktiviert.

# MID v0.9.85.267 · RUC-Daten verlustfrei komprimiert veröffentlichen

- Der RUC-Hintergrunddienst erhält ein vollständiges verlustfrei komprimiertes Datenprofil: Wetterwerte, Missing-Daten, Modellläufe und Zeitintervalle bleiben bitidentisch. Das veröffentlichte Datenpaket wird erst nach vollständig unabhängigen Python-/JavaScript- und Originaldatenprüfungen freigegeben.
- Für jeden komprimierten RUC-Lauf wird ein unveränderlicher Rohsnapshot zur Rücknahme gesichert. Bei fehlerhaftem produktivem Worker-Healthcheck versucht der etablierte GitHub-Pages-Weg automatisch die geprüften Originaldaten desselben Laufs wiederherzustellen.
- Aktualitätsprüfung, Installer-Restore und öffentliche Worker-/Pages-Healthchecks berücksichtigen das neue Format und unterscheiden es strikt vom bisherigen Rohprofil und von inaktiven Kompressionskandidaten.
- Das unveränderte 900-MB-Speicherlimit, amtliche Modellherkunft und Warntrennung sowie sämtliche bestehenden Parameter bleiben geschützt. Die tatsächliche Datenspeicherumstellung erfolgt erst mit dem nächsten vollständig geprüften RUC-Publish nach Stable-Promotion; bis dahin können einzelne Läufe kontrolliert ausfallen.
- Zusätzliche Parameter und Modellzeiten werden erst nach nachgewiesener produktiver Speicherreserve, gültigen DWD-Quellterminen und Leistungsprüfung zugeschaltet.
