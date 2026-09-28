# MID 0.9.85.100 · MID 18.2.12 · Mobile Einstellungsnavigation

## Anlass
Auf kleinen Smartphone-Viewports konnte der lange Einstellungsbereich „Inhalte & Navigation“ am rechten Rand abgeschnitten wirken. Die horizontale Fortsetzung der einzeiligen Tab-Navigation war zudem nicht immer eindeutig erkennbar.

## Umsetzung
- Der aktive Einstellungs-Tab wird beim Öffnen, Bereichswechsel und relevanten Größenänderungen vollständig in das sichtbare Scrollfeld geführt.
- Die Tab-Leiste bleibt bewusst einzeilig und horizontal scrollbar; sie wird nicht in mehrere hohe Zeilen umgebaut.
- Dezente linke/rechte Fortsetzungshinweise werden aus der tatsächlichen Scrollposition abgeleitet und nur angezeigt, wenn in der jeweiligen Richtung weitere Tabs vorhanden sind.
- Die mobile Navigation behält 44-px-Touchziele, Safe-Area-Abstände und eine ausgeblendete native Scrollbar.
- Reduced-Motion wird beim automatischen Nachführen berücksichtigt.
- Wetterfachlogik, Datenquellen, Prognoseberechnung, Schwellen, Parameterfarben, Worker und native iOS-Fachlogik bleiben unverändert.

## Prüfung
- Replit-Sichtprüfung: 360×800 und 390×844, jeweils Light und Dark, ohne abgeschnittenen aktiven Tab.
- Fokussierte Regression: `scripts/test-settings-mobile-horizontal-tabs.mjs` grün.
- Bestehender Responsive-Vertrag: `scripts/test-mid-18-2-7-responsive-ia-098590.mjs` grün.
- Replit-Handoff-Gate einschließlich Produktionsbuild sowie gemeinsamer Web-/iOS-Hülle vollständig grün.
