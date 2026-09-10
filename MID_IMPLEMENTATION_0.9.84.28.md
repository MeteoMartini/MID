# MID v0.9.84.28 – Firmenclient-Widget-Export

## Ziel
Den bestehenden PowerPoint-/PNG-Workflow aus dem aktuellen Stand v0.9.84.27 so umbauen, dass er auf einem restriktiven Windows-Firmenclient ohne Administratorrechte und ohne zusätzliche Installation nutzbar ist.

## Umsetzung
- `tools/widget-export/Update-MID-Widgets.ps1` benötigt kein Node.js mehr. Es startet ausschließlich das bereits vorhandene Microsoft Edge und steuert die Seite über einen zufälligen lokalen CDP-Port.
- Edge lädt `https://www.midwx.app/` selbst. Proxy, Windows-/Firmenzertifikate und Unternehmensrichtlinien werden weder ersetzt noch abgeschaltet.
- Die zwölf vereinbarten Exportkombinationen (Wiesbaden/Kürecik/Malatya × kompakt/Kurve × 5/7 Tage) werden mit `farben=ecmwf` geladen.
- MID muss für jedes Bild sein vorhandenes `midWidgetReady=ready` melden; danach wird nur die tatsächliche `.weatherwidget`-Fläche erfasst.
- PNG-Signatur, Mindestgröße und Widgetabmessungen werden geprüft. Alle Dateien werden zuerst in einem Staging-Ordner erzeugt und erst nach vollständigem Erfolg atomar auf die festen PowerPoint-Dateinamen verschoben.
- Standardausgabe ist der persönliche Windows-Bilderordner `MID-Widgets`; der bisherige Systemlaufwerkspfad entfällt.
- `Update-MID-Widgets.cmd` ist der Doppelklick-Einstieg. Er setzt keine ExecutionPolicy herab. Bei einer Richtliniensperre öffnet er `MID-Widget-Fallback.html`.
- `FIRMENCLIENT-README.txt` dokumentiert den Sicherheits- und PowerPoint-Vertrag.

## Bewusst nicht umgesetzt
- Keine Installation von Node.js, npm, winget, Browsern, PowerShell-Modulen oder Zertifikaten.
- Keine Änderung von Registry, Firewall, Proxy oder ExecutionPolicy.
- Keine Edge-Parameter zum Ignorieren von Zertifikaten oder zum Abschalten der Sandbox.
- Keine Umgehung einer Firmenrichtlinie, die Headless Edge oder DevTools deaktiviert.

## Fachliche Auswirkung
Keine. Wetterlogik, WMO-/DWD-Regeln, Modellfusion, Warnlogik und Datenquellen bleiben unverändert.

## Release/Worker
Der Cloudflare Worker bleibt fachlich unverändert und erhält nur die gemeinsame Versionsmarke v0.9.84.28. Das gekoppelte `MID-worker.zip` bleibt Notfall-/Audit-Artefakt; für diesen Firmenclient-Fix ist kein manueller Worker-Upload erforderlich.
