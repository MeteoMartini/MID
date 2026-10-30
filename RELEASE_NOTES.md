# MID v0.9.85.381 – Reproduzierbare CI/CD-Phasenmessung

- Die GitHub-Laufzeitdiagnose unterscheidet jetzt zusätzlich die Zeiten für Warteschlange, Setup, npm, Produktionsbuild, Core, Heavy, SHA-Bot, Paketierung, Worker, Pages und Stable.
- Parallele Jobs werden bei der tatsächlichen Dauer nicht doppelt addiert. Die belegte Runnerarbeit wird getrennt dargestellt; echte Wartephasen, Zeitlücken, wiederholte und übersprungene Jobs bleiben kenntlich.
- P50/P95 je Phase berücksichtigen nur erfolgreiche Läufe mit vollständig vorhandenen Zeitstempeln. Fehlende Daten werden ausdrücklich als „n/a“ angezeigt, niemals als 0.
- Die umfangreichen Negativtests laufen im bereits verpflichtenden CI-Timing-Regressionspfad. Keine meteorologischen, UI-, Warnungs- oder Modelländerungen.
- Source-/Installer-/Worker-/Pages-/Stable-Gates und Schutzregeln bleiben vollständig erhalten. Signierte Quellbeobachtung und Build-Parität sind weiterhin **keine** Freigabe, Build- oder Testergebnisartefakte produktiv wiederzuverwenden.

