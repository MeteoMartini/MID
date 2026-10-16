# MID-C33 · komprimierter RUC-Snapshot im Installer · .269

Verifizierte Stable-Basis .267 ecf02987da0a35d137633830f2dbccdfc31635ca. Bekannter, vollständig geprüfter .268-Main-/Installerstand ffc3dcd90382e7badf39dce36fc1b8e07270016a normal übernommen; SourcePR377 und Skybarfix bleiben erhalten. .268 ist noch nicht auf Stable veröffentlicht.

Beleg: Installer38851979947 Pages-Versuch1 Job116819150334 übersprang den eigentlichen Deploy04:58:13UTC. check_ruc_snapshot_current.py akzeptierte ausschließlich pages-free-v1; gültiges pages-lossless-v1 wurde deshalb unabhängig von exakter Run-ID abgelehnt. Dieselbe Prüfung gilt in allen regulären Wiederholungen. Kein beschädigter öffentlicher RUC-Datensatz daraus ableitbar. Kein Guard/Lock/Timeout/Workflow/Recht umgangen.

Gezielte Reparatur: beide unterstützten Profile zulassen, für pages-lossless-v1 zusätzlich den vorhandenen strengen active_profile_valid-Vertrag des Healthprüfers verlangen. Kandidaten, unbekannte Profile, falsches Schema, productionEnabled false/String und widersprüchliche Transportmetadaten bleiben abgelehnt. Exakte Run-ID und leere/alte/neue Pointer bleiben unverändert geschützt. Rohprofil rückwärtskompatibel. Kein Publisher-/Worker-/Feld-/Budgetwechsel.

Erweiterte vorhandene Pflichtregression test-ruc-workflow-coordination-0985173.mjs ruft reale Python-Tests auf: positives aktives Kompressionsprofil, Runwechsel/fehlender erwarteter Lauf und sieben negative Metadatenfälle. Liveprobe erfolgt read-only mit dem tatsächlichen komprimierten öffentlichen Manifest. Veröffentlichung ausschließlich erneuter Source-PR → bestehender Bot → Installer/Pages → Stable.
