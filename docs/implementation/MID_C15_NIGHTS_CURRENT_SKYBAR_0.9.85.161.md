# MID-C15 · v0.9.85.161

Basis: main = mid-stable = 248987161638f06f7d315882aff988fd95e0de71, veröffentlichte Version .160.

## Nachtstunden

Die astronomischen Nachtintervalle waren noch vorhanden. Der Verlauf verwendete jedoch `--mg-night` mit bereits transparenter Farbe (Alpha .1 im hellen und .22 im dunklen Profil) und zusätzlich .2 Stop-Deckkraft. Das ergab nur .02 bzw. .044 effektive Deckkraft. Die gemeinsamen SVG-Verläufe verwenden jetzt `--mid-night-band-color` mit opakem Fallback #5b667c; .2 wird einmal angewendet. Der 7d-Fallback ohne Ort nutzt denselben Farbvertrag. App, Widget, PNG, Tageskarten, 14d und übrige SVG-Nachtverläufe profitieren von der gemeinsamen Korrektur. Astronomische Grenzen und Übergänge bleiben unverändert.

## Aktuell · 12 Stunden

Die aktive CSS-Regel stauchte das 16-Einheiten-SVG auf 12 px. SVG-Höhe und maximale Höhe sind jetzt 16 px, Behälter und Gridzeile 18 px, entsprechend 90 min. Die vier meteorologischen Dickenstufen bleiben im gemeinsamen SkyBarSegmentsSvg; Quadrateinstellung und Fachlogik werden nicht verändert.

## Prüfungen

Die vorhandenen Browserprüfungen überprüfen zusätzlich opake tatsächlich aufgelöste Nachtfarben in App und Widget in beiden Themes sowie die aus App.tsx extrahierte tatsächliche 12h-SVG-Darstellung bei sechs Viewports. Historische Source-Tests wurden ausschließlich auf den bewusst geänderten Nachtfarbtoken aktualisiert; keine Prüfung entfernt und kein Budget erhöht. Vollständige Releaseprüfung und geschützter Veröffentlichungsweg bleiben verpflichtend.

Offener Vorgängerpunkt: Aktueller Status der CodeQL-Alerts #92–#98 ist über den verfügbaren Connector nicht lesbar; erfolgreiche CodeQL-Läufe allein belegen keine geschlossenen Alerts. Broker-Issue #176 bleibt als permanenter Releasekanal offen.
