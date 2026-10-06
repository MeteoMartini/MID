# MID v0.9.85.182

- Die automatische Widget-Erzeugung wiederholt einzelne fehlgeschlagene Renderings jetzt kontrolliert, statt den gesamten 12er-Satz wegen eines einmaligen Daten-Timeouts sofort abzubrechen.
- Pro Widget sind höchstens drei Render-Versuche mit erweitertem Daten-/Render-Zeitfenster zulässig; nach dem dritten Fehlschlag bleibt der Export weiterhin fail-closed.
- Widget-Inhalte, Standorte, Profile und die SharePoint-Übergabe bleiben unverändert.
