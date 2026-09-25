# MID 0.9.85.99 · MID 18.2.11 · Responsive Forecast-Horizontnavigation

## Anlass
Die Horizontleiste der Vorhersage konnte auf schmalen Smartphones die erste Prognosezeile überdecken. Im schmalen Querformat wurde sie nach dem Sprung auf „Vorhersage“ teilweise oberhalb des sichtbaren Bereichs positioniert.

## Umsetzung
- Der Navigationssprung auf moderne Prognosemodule berücksichtigt die unmittelbar zugehörige Horizontleiste als sichtbares Scrollziel.
- Andere Dashboard-Module behalten ihr bisheriges Scrollverhalten.
- Zwischen Horizontleiste und Prognoseinhalt gilt auf kleinen Viewports ein klarer Abstand.
- Die Scrollposition berücksichtigt die obere Safe Area.
- Es wurde keine Sticky- oder Fixed-Navigation eingeführt.
- Wetterfachlogik, Datenquellen, Modellfusion, Schwellen und Parameterfarben bleiben unverändert.

## Prüfung
- Replit-Handoff-Gate vollständig grün.
- Neuer Regressionstest: `scripts/test-modern-forecast-horizon-viewport.mjs`.
- Bestehender Responsive-Vertrag `scripts/test-mid-18-2-7-responsive-ia-098590.mjs` grün.
- Produktionsbuild und Web-/iOS-Hüllenprüfung im Handoff-Gate grün.
- 360×800 Light wurde in der Replit-Preview visuell bestätigt; die übrigen Zielgrößen sind regressionsgeschützt, konnten wegen instabiler Browserautomation nicht belastbar als reale Sichtprüfung bestätigt werden.
