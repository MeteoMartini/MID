# MID v0.9.84.89 · kanonische schwebende Bottom-Bar

## Ziel

Die bisherige mobile Hauptnavigation wird für Web/PWA auf ein einziges, dauerhaft unterstütztes Bedienkonzept konsolidiert. Die frühere Auswahl **Bedienkonzept / Bottom-Leiste · Beta** entfällt. Auf kompakten Viewports steht die Navigation als schwebende, iOS-inspirierte Glass-Bar am unteren Bildschirmrand; auf größeren Desktopbreiten bleibt die platzsparende Seitenleiste erhalten.

## Umsetzung

- Mobile Hauptziele: **Aktuell · Kurzfrist · 7 Tage · 14 Tage · Mehr**.
- Labels sind einzeilig (`nowrap`, `keep-all`, keine Silbentrennung); Icons und Typografie skalieren auf sehr schmalen Geräten moderat, die Touchfläche bleibt mindestens 52/54 px.
- Die Bar ist vom Seitenrand gelöst, safe-area-konform und auf maximal 620 px Breite begrenzt. Transparenz, Blur, Randlicht und selektierte Glass-Fläche orientieren sich an der aktuellen iOS-Navigationshierarchie, ohne Wetterinhalte zu verdecken.
- Scroll-Autohide mit Hysterese: ab 28 px kumuliertem Abwärtsscrollen wird minimiert, ab 14 px Aufwärtsscrollen wieder eingeblendet. Nahe dem Seitenanfang, bei Fokus in der Leiste und beim Öffnen von **Mehr** bleibt sie sichtbar.
- `prefers-reduced-motion` deaktiviert die Übergangsanimationen.
- Weitere Fachmodule, Karten, Planer und Werkzeuge bleiben über **Mehr** erreichbar. Die bestehende Desktop-Sektionsnavigation bleibt erhalten.
- Der alte lokale Schlüssel `mid:navigationMode:v1` wird beim Start entfernt.
- Der Einstellungsblock **Bedienkonzept** einschließlich **Bottom-Leiste · Beta** wurde aus der UI entfernt.

## Fachliche Isolation

Die Navigation selbst verändert keine Wetterdatenpfade, Piktogrammregeln, Warn-/Pushlogik, Radar-/Satellitenprodukte, Modellfusion, Einheiten oder Parameterfarben. Gegenüber v0.9.84.88 wird keine weitere Worker-Fachlogik geändert. Da v0.9.84.88 jedoch am Installer-Gate scheiterte und seine Worker-Änderungen aus Synoptik/Push damit noch nicht stabil ausgerollt wurden, bleibt der Worker-Upload für den kumulativen v0.9.84.89-Release erforderlich.

## Installer-Mitigation

Der vor der Paketierung geprüfte Installer #1042 für v0.9.84.88 scheiterte nach erfolgreichem ZIP-Import, `npm ci` und Dependency-Audit im TypeScript-Gate an genau einem ungenutzten lokalen Binding in `RadarPanel.tsx`: `latestLightningTime` (TS6133). Dieses Binding wurde in v0.9.84.89 entfernt; es hatte keine fachliche Funktion mehr. Die Änderung ist absichtlich minimal und verändert weder Blitzdaten noch deren Darstellung.

## Mitigation / Rückfall-Schutz

Die historischen Navigationstests wurden auf den ab v0.9.84.89 gültigen Vertrag migriert. Die neue Pflichtregression `scripts/test-ios-floating-bottom-bar-098489.mjs` schützt Safe Areas, einzeilige Labels, Touchziele, Scroll-Autohide, Reduced Motion, die Entfernung der Beta-Auswahl und die Styles-Aggregation.
