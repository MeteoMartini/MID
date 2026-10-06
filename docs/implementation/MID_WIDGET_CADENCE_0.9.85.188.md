# MID v0.9.85.188 · Widget-Export viermal täglich

## Ziel

Der serverseitige Export der zwölf festen MID-Widget-PNGs benötigt keine stündliche Aktualisierung. Vier gleichmäßig verteilte automatische Läufe pro Tag sind ausreichend und reduzieren redundante GitHub-Actions-Läufe.

## Triggervertrag

Automatische Ausführung ausschließlich über:

```yaml
schedule:
  - cron: '17 0,6,12,18 * * *'
```

Damit startet der Export automatisch um 00:17, 06:17, 12:17 und 18:17 UTC.

Die früheren automatischen Trigger `workflow_run` nach dem MID-Installer und `push` auf `mid-stable` sind entfernt. Dadurch erzeugen Releases keine zusätzlichen Widget-Renderläufe mehr.

`workflow_dispatch` bleibt ausschließlich für bewusst ausgelöste manuelle Diagnose- oder Notfallläufe erhalten.

## Unveränderte Schutzmechanismen

- Checkout ausschließlich von `mid-stable`.
- Lokale Versionsspiegel müssen konsistent sein.
- Öffentliche `www.midwx.app/version.json` muss dieselbe MID-Version melden.
- Exakt zwölf definierte PNG-Varianten.
- PNG-/Abmessungs-/SHA-256-/Manifest-Validierung unverändert.
- Begrenzter Retry pro Widgetvariante unverändert.
- Veröffentlichung nur als rollierendes `widget-latest`-Paket.
- Aktiver und kanonischer GitHub-Workflow müssen bytegleich bleiben.

## Regression

Die bestehenden Widget-Automationsregressionen wurden an den bewusst geänderten Triggervertrag angepasst und prüfen jetzt zusätzlich:
- genau einen Cron-Ausdruck;
- exakt den Viermal-pro-Tag-Cron;
- kein automatisches `workflow_run`;
- kein automatisches `push` auf `mid-stable`;
- weiterhin vorhandenes `workflow_dispatch`.

Meteorologische Logik und Widgetdarstellung bleiben unverändert.
