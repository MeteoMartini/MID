# Baseline-Brücke v0.9.3.0 → v0.9.4.0

Der Nutzer hat v0.9.3.0 als aktiven Stand des regelmäßigen MID-Qualitätsaudits bestimmt. Beim verpflichtenden Lesezugriff auf `MeteoMartini/MID`, Branch `mid-stable`, waren über den verfügbaren GitHub-Connector noch v0.9.2.0 in `package.json` und `MID_BASELINE.json` sichtbar.

Für v0.9.4.0 gilt deshalb:

- v0.9.3.0 wird als fachlicher Audit- und Qualitätsvertrag fortgeführt.
- Die tatsächlich bearbeitete Codebasis ist der vollständig verfügbare, geprüfte Stable-/Releaseinhalt mit den Cockpit- und Synoptikfunktionen.
- Keine geschützte Funktion wird auf einen älteren Stand zurückgesetzt.
- Der neue Stable-Stand darf erst nach erfolgreichem GitHub-Build, vollständiger Regression und erfolgreichem Pages-Deployment gelten.
