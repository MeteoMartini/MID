# MID v0.9.85.130 – Gesundheitswetter sichtbar und letzte Hauptansicht persistent

## Verifizierte Basis
- Repository: `MeteoMartini/MID`
- `main == mid-stable == c1db743f987cdf7ced34f9ff8c65b7c87d69fc5e`
- Ausgangsversion: v0.9.85.129
- Integrationsbranch: `chatgpt/v0.9.85.130-health-weather-settings`

## Befund I – Gesundheitswetter
Der Nutzer-Screenshot aus „Einstellungen → Inhalte & Navigation“ zeigte nur die Dashboard-Modulliste. Im React-Code existierte zwar bereits ein Gesundheitswetter-/Pollenblock, er lag jedoch innerhalb des generischen ersten Settings-Bereichs. Die CSS-Regel für `.settings-split-navigation` blendete diesen Bereich in der Navigationsansicht aus.

Die Korrektur:
1. Gesundheitswetter wird als eigene `settings-health-weather-section` außerhalb des ausgeblendeten Primärblocks gerendert.
2. Die Navigations-Split-Regel blendet alle anderen Settings-Sektionen weiterhin aus, nimmt Gesundheitswetter aber explizit aus.
3. Der Pollenflug-Schalter bleibt an `pollenDisplaySettings.showPollenForecast` gebunden; Persistenz und DWD-Datenlogik ändern sich nicht.
4. Der alte verschachtelte Gesundheitswetterblock wird entfernt, damit kein doppelter Einstellort entsteht.

## Befund II – letzter Hauptbereich
MID hatte bereits `mid:last-dashboard-section:v1` für das exakte Modul. Für die aktuelle Bottom-Bar ist das allein nicht robust genug, weil Modulstruktur und primäre Navigationsgruppen nicht identisch sind und ältere/ungültige Werte zu einem Default führen können.

v0.9.85.130 ergänzt:
- `mid:last-primary-navigation:v1` mit `current | today | forecast | composite | more`;
- deterministische Zuordnung von Modulen zu den sichtbaren Haupttabs;
- Fallback `Heute → short-term`, `Vorhersage → forecast`, `Karten → composite`, sonst `Aktuell → current`;
- Lifecycle-Flush bei `pagehide` und bei `visibilityState=hidden`;
- gerätelokale Behandlung in `portableUserData.ts`, damit ein anderes Gerät die zuletzt gewählte lokale App-Ansicht nicht überschreibt.

## Regression
- `scripts/test-health-weather-settings-visible-0985130.mjs`
- `scripts/test-last-primary-navigation-persistence-0985130.mjs`

## Fachliche Abgrenzung
Keine Änderung an DWD-Pollenflug-Gefahrenindex, Pollenregionen, Wettermodellen, Warnungen, Schwellenwerten oder Worker-Fachlogik.
