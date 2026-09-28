## MID v0.8.24.2 umgesetzt

**Automatische Versionsbewertung:** Wartungsstand ab **v0.8.24.1**, da bestehende Texte und die Bedienposition der bereits vorhandenen Aktuell-Wetter-Kachelfunktion korrigiert wurden.

### I. Eigene Warnungen

Unter den automatisch erzeugten Warnkacheln steht ausschließlich:

> Automatisch aus Best Match abgeleitet.

Die bisherigen technischen Erläuterungen zu DWD-Kriterien, niedrigeren Intensitätsstufen und dem nichtamtlichen Charakter wurden an dieser Stelle entfernt.

### II. Aktuelles Wetter

- Geschlossene Schaltfläche: **mehr**
- Geöffnete Schaltfläche: **weniger**
- kompakte Pillenform
- am unteren rechten Rand des Aktuell-Wetter-Moduls positioniert
- Abstand unterhalb des Moduls reserviert
- eigener Ebenenwert gegen Verdecken
- mobile Positionierung und Abstände angepasst
- vollständige Maus-, Touch- und Tastaturbedienung sowie `aria-expanded`, `aria-controls` und beschreibende Zugänglichkeitsnamen bleiben erhalten

### Prüfung

- bestehender Persistenz- und Bedienvertrag der Messwertkacheln
- neuer Vertrag für „mehr“/„weniger“ und Randposition
- gekürzter Fußtext der eigenen Warnungen
- allgemeine Responsivitäts- und Versionsprüfung
- Worker-Syntaxprüfung

### Worker

- keine funktionale Worker-Änderung
- nur Versionssynchronisierung auf **v0.8.24.2**
