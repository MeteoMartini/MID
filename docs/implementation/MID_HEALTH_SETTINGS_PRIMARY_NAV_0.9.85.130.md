# MID v0.9.85.130 – Gesundheitswetter-Sichtbarkeit und Primärnavigation

## Verifizierte Basis
- Repository: `MeteoMartini/MID`
- Basis: `main == mid-stable == c1db743f987cdf7ced34f9ff8c65b7c87d69fc5e`
- Vorversion: v0.9.85.129
- Entwicklungsbranch: `chatgpt/v0.9.85.130-settings-nav-restore`

## Befund I – Gesundheitswetter
Die React-Struktur enthielt bereits eine eigene Liste `settings-health-weather` mit persistentem Pollenflug-Schalter. Der Screenshot war dennoch korrekt: Der CSS-Split für „Inhalte & Navigation“ setzte sämtliche direkten `.settings-section`-Kinder auf `display:none` und blendete nur `.dashboard-module-settings` wieder ein. Damit war der Pollen-Schalter logisch vorhanden, aber visuell unerreichbar.

v0.9.85.130 lässt im Navigation-Split die primäre Optionssektion sichtbar und blendet darin ausschließlich navigationseigene Listen ein. Reihenfolge:
1. Gesundheitswetter → Pollenflug
2. weitere optionale Inhaltsmodule
3. Modulreihenfolge

Der Pollen-Schalter verwendet weiterhin `mid:pollenDisplaySettings`; DWD-Datenabruf und Pollenfachlogik bleiben unverändert.

## Befund II – letzter Hauptbereich
`mid:last-dashboard-section:v1` speicherte nur DashboardModuleIds. Das reichte für Aktuell/Heute/Vorhersage/Karten meist aus, konnte aber „Mehr“ nicht ausdrücken und vermischte Primärbereich und Untermodul. Zusätzlich entfernte die Modulinitialisierung einen vorhandenen `#mid-section-…`-Hash, bevor der Startup-Restore ihn priorisieren konnte.

v0.9.85.130 ergänzt `mid:last-primary-navigation-area:v1` für `current|today|forecast|composite|more`.
- Navigation zu einem Modul aktualisiert Primärbereich und Untermodul gemeinsam.
- Tippen auf „Mehr“ speichert `more`; ein neuer App-Aufruf öffnet den Drawer wieder, sofern kein expliziter Section-Deep-Link vorliegt.
- Bewusstes Schließen von „Mehr“ speichert wieder den darunter aktiven Primärbereich.
- Explizite `#mid-section-…`-Deep-Links werden nicht mehr entfernt und haben beim Start Vorrang.
- Forecast-Horizon und Untermodul bleiben weiterhin separat erhalten.

## Regression
`scripts/test-health-settings-primary-navigation-0985130.mjs` schützt Sichtbarkeit/Persistenz des Gesundheitswetter-Schalters, den CSS-Split, den Primärbereichsschlüssel, „Mehr“-Restore, manuelles Schließen und Deep-Link-Priorität.

## Abgrenzung
Keine Änderung an DWD-Pollendaten, Warnungen, Wettermodellen, Worker-Fachlogik oder Datenquellen.


## CSS-Kaskadennachgang
Die erste Quellprüfung identifizierte zusätzlich eine spätere Override-Regel in `midC18I7ResponsiveFixes.css`, die `.settings-primary-options` im Navigation-Split erneut ausblendete. Diese Regel wird ebenfalls korrigiert. Die Regression liest deshalb beide CSS-Schichten und schützt die effektive Kaskade, nicht nur die frühere WorkPackage-I-Datei.


## Finaler Kaskaden-/Budget-Fix
Statt zwei bestehende CSS-Splitverträge gegeneinander zu überschreiben, werden Gesundheitswetter und optionale Inhaltsmodule als direkte Kinder des Navigation-Stacks außerhalb von `.settings-primary-options` gerendert. Dadurch bleiben die seit MID 18.2.6 beabsichtigten Ausblendregeln für Darstellungsoptionen unverändert, während Gesundheitswetter und Moduloptionen sichtbar vor der Modulreihenfolge stehen. Beide zuvor geänderten CSS-Dateien entsprechen wieder exakt dem v0.9.85.129-Stable-Stand; das CSS-Budget wird nicht erhöht.


## Persistenz-Härtung vor Release
Vor dem finalen Source-Gate wurde der Primärbereich zusätzlich gegen iOS/PWA-Suspend gehärtet:
- Fehlt oder ist `mid:last-dashboard-section:v1` ungültig, dient der gespeicherte Primärbereich als deterministischer Fallback für Aktuell / Heute / Vorhersage / Karten.
- Der zuletzt sichtbare exakte Bereich wird bei `pagehide` und beim Wechsel in `visibilityState=hidden` erneut geschrieben.
- `mid:last-primary-navigation-area:v1` ist explizit gerätelokal und wird nicht über den MID-Geräteabgleich auf andere Geräte übertragen.
