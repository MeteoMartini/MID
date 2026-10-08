# MID-C21 · Kurven-Widgets kompakter · v0.9.85.199

## Verifizierte Basis
`main` = `mid-stable` = `36110a193328b0e4a5978e742e3768a8fcd9664f` (v0.9.85.198); offene Dependabot-PRs wurden nicht integriert. Separater `chatgpt/*`-Branch, keine direkte Änderung an geschützten Branches.

## Änderung
Im gemeinsamen `SevenDayCurveOverview` wird der bisherige zweizeilige Kopf ausschließlich bei `presentationReady` nicht mehr gerendert. Dies betrifft die eingebettete Widget-Kurvenvorschau und die PNG-/URL-Exporte, nicht die reguläre interaktive 7-Tage-Kurvenübersicht. Die Orts-/Koordinaten-/Höhen-/Ortszeitangaben des übergeordneten Widgets bleiben erhalten. Frei gewordene Höhe wird durch vollständiges Weglassen des Headers ohne Restabstand genutzt.

Entfernte Texte im Widget: „7-Tage-Kurvenübersicht“ und „Wetterstreifen, Temperaturtrend & Niederschlag“. Der beschreibende `aria-label` am Diagramm bleibt erhalten; Graphen, Wetterstreifen, Temperatur, Niederschlag, Wind/Böen, Piktogramme, Legende und Zeitachse bleiben unverändert.

## Qualität / Release-Gates
Eine zusätzliche Assertion in der bestehenden Pflichtregression `scripts/test-widget-curve-label-spacing-0985191.mjs` schützt die konditionale statt globale Entfernung. Alle bisherigen Pflichttests, Responsive-Prüfungen, Builds, iOS-Hülle und der gesicherte Releasepfad sind unverändert erforderlich. Keine Änderung an meteorologischer Berechnung, API, Datenquellen oder Workflow-Permissions. Stable-Promotion erst nach erfolgreichem Gate → Auto-/geschütztem Merge → Installer → Pages/Worker-Gates.
