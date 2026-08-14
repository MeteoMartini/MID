# MID v0.9.53.20

## Einheitlicher Öffnungszustand großer Module

- Alle großen `CollapsibleModule`-Sektionen verwenden denselben persistenten `mid:module:<id>:open`-Vertrag.
- Ein beim Navigieren gesetzter `#mid-section-*`-Hash wird bei einem App-Neustart nicht mehr als impliziter Öffnungsbefehl interpretiert.
- Eine einmalige v2-Migration setzt die standardmäßig geschlossenen Hauptmodule auf einen sauberen geschlossenen Ausgangszustand und entfernt einen verbliebenen Dashboard-Hash. Danach wird ausschließlich die Nutzerentscheidung gespeichert.
- `storage`-Änderungen werden zwischen parallelen Tabs/Fenstern synchronisiert.
- Berg-/Wintersport und Wassersport behalten ihre bewusst abweichenden bedingten Defaults, verwenden danach aber denselben Persistenzmechanismus.

Neue Required-Regression: `scripts/test-module-open-state-095320.mjs`.
