# MID v0.9.84.94 – Implementierungsbericht

## Basis
Ausgangspunkt ist der erfolgreich veröffentlichte Stable-Stand **v0.9.84.93** (Installer #1047). Die Änderungen dieses Releases betreffen ausschließlich Frontend-/Darstellungslogik; keine neue Worker-Fachlogik wurde ergänzt.

## Änderungen

### Bottom-Bar
- Die Bottom-Bar-Einstellungen verwenden denselben Karten-/Menüstil wie die Favoritenleiste.
- Die schwebende Bottom-Bar sitzt auf iPhone-/Mobil-Viewports wieder mit sichtbarem Abstand oberhalb des unteren Bildrands bzw. Home-Indicators.
- Im Auto-Modus bleibt auch die minimierte Leiste deutlich sichtbar und kann nicht nahezu vollständig am unteren Rand verschwinden.

### Synoptik / 500-hPa-Isohypsen
- Das Modelllinien-Pane wird auch dann gerendert, wenn die verfügbaren Isohypsen aus dem separaten Grid-Frame stammen und kein vollständiger dominanter Modellframe vorliegt.
- Die Synoptik-Bereitschaft wird je Linienmodus getrennt bewertet; reine Isohypsen können dadurch unabhängig von der nativen Isobarenbereitschaft sichtbar werden.
- Isohypsen und Druckzentren verwenden weiterhin den expliziten SVG-Renderer im Modelllinien-Pane sowie die geglättete Gold-/Amber-Darstellung mit gpdm-Labels.

### Tagesansicht / 24-h-Profil
- Temperatur, gefühlte Temperatur, Taupunkt, Luftdruck, Wind und Böen werden mit der bereits vorhandenen monotone-Cubic-Interpolation geglättet.
- Die Niederschlagswahrscheinlichkeit bleibt geglättet; die Temperaturfläche folgt nun ebenfalls der geglätteten Temperaturkurve.
- Es werden keine zusätzlichen meteorologischen Zwischenwerte erfunden; die Glättung betrifft ausschließlich die visuelle Verbindung der vorhandenen Stützpunkte.

## Prüfungen
Die fokussierten Regressionen für Bottom-Bar, Synoptik/Isohypsen, Tagesansicht und Diagrammlayout wurden lokal ausgeführt. Der vollständige Build bleibt dem GitHub-Installer vorbehalten, da die lokale Containerkopie keine installierten npm-Abhängigkeiten enthält.

## Worker
**Keine neue Worker-Fachänderung in v0.9.84.94.** Installer #1047 hat v0.9.84.93 erfolgreich veröffentlicht; die zuvor kumulative Worker-Änderung aus v0.9.84.92 ist damit bereits ausgerollt.
