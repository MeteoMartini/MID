# MID v0.9.79.0 · Optionales neues Bedienkonzept, Schritt 1

## Ausgangsbasis

Verbindliche Arbeitsbasis war v0.9.78.83 aus dem aktuellen Professional-Replacement-Stand.

## Umgesetzt

- persistenter neuer Navigationsmodus `classic | bottom-tabs`
- Standard bleibt `classic` als vollständiger Fallback
- neue Einstellung unter Ansicht & Einheiten
- mobile Bottom-Tab-Bar: Heute · Prognose · Karte · Planen · Mehr
- semantische Gruppierung auf bestehende MID-Module ohne neue Datenpfade
- vollständiger bestehender Drawer weiterhin über „Mehr“
- iOS-Safe-Area und Hoch-/Querformat berücksichtigt
- mindestens 44 px hohe Touchziele; Hochformat 52 px
- Desktop-Sektionsrail bleibt unverändert
- neues Bedienkonzept verändert weder Radarprodukte/-farben noch Parameterfarben oder Einheiten
- persistenter Schlüssel ist automatisch Bestandteil des bestehenden portablen Geräteabgleichs

## Bewusst noch nicht Teil dieses Schritts

- kompakter neuer Mobile-Header
- zusammengeführte Prognose-Zeithorizontleiste 90 min / 24 h / 7 T / 14 T / Saison
- eigener Map-Focus-Modus
- dynamische „Heute relevant“-Ebene

Diese Punkte folgen schrittweise, damit der klassische Fallback jederzeit stabil bleibt.
