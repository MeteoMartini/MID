# MID-C15 · v0.9.85.160

Basis: main = mid-stable = 6133022f71dffade571c8e94909ec4b2298462ca; www.midwx.app/version.json lieferte .159.

## Darstellung

- Die gespeicherte ECMWF-Option in Einstellungen wirkt auf die 7d-Tageskarten, klassische Tagesliste und gemeinsame stündliche 7d-Kurve. Ohne Option bleiben Tmin blau, Tmax rot und Temperaturkurve rot. Widget/URL behalten ihre ausdrücklich gespeicherte Exportoption; derselbe Renderer setzt sie auch für die Kurve um.
- Einzigartige useId-Gradienten verhindern Kollisionen zwischen mehreren Kurveninstanzen. Echtes P25–P75 und astronomische Nacht-/Skybar-Flächen bleiben erhalten.
- src/parameterLineStyle.ts ist die zentrale, tatsächlich gerenderte Vorgabe für alle sieben Parameterlinien im 24h-Profil und aufgeklappten Tagesdetail. Farbe, Breite, Strichmuster, Rundung, Deckkraft und Vektoreffekt werden im Browser verglichen. Die Wochenkurve nutzt ebenfalls die gemeinsame Temperatur-Linienvorgabe; ECMWF ist eine explizite Farbausnahme.
- Der ursprüngliche 24h-UTCI-Goldton aus .156 (#d6c7a4 dunkel, #8a6d3d hell) wird über --apparent-line wiederhergestellt. Die Temperatur-/Textmischung aus .157 war nicht die gewünschte Referenzfarbe.

Historische Strukturprüfungen wurden nur an diese beauftragte optionale Palette und den zusätzlichen gespeicherten Default angepasst. Das vollständige Inventar von 905 Regressionen bleibt erhalten. Die bestehende Palette-Regression prüft zusätzlich echte Farbhelfer, gespeicherte Boolean-Semantik und die gemeinsame Linienfunktion.

## CI und Fälle

- Coverage .159 scheiterte in Run 37184490317: Vitest im npm-exec-Präfix konnte Vite nicht auflösen, obwohl MID selbst Vite installiert hatte. scripts/run-vitest-pilot.mjs installiert deshalb alle exakt benannten Pilot-Pakete gemeinsam in einen isolierten Prefix. MID-Abhängigkeiten, Lockfile und Workflow-Gates bleiben unverändert. Der Pilot wurde mit Node 22.16.0/npm 10.9.2 geprüft, nicht nur mit der lokalen npm-Version.
- #184 geschlossen mit Belegen: vollständige nächtliche Revision 37112268461, Stable-CI/CodeQL 37185258839 und aktueller API-/Produktiv-Healthcheck 37181671248 erfolgreich. Automatische Fehlererkennung bleibt aktiv.
- #176 bleibt offen: absichtlich dauerhafter maschinenlesbarer Broker-Kanal, kein unerledigter Produktfehler.
- PR #139 nach Prüfung geschlossen, nicht gemergt: das Sammelupdate enthält nicht validierte React-/MapLibre-/Vite-Minor-Upgrades außerhalb des geschützten Stable-Vertrags. Dies ist keine generelle Update- oder Sicherheits-Entwarnung.
- CodeQL #92–#98 bleiben hinsichtlich ihres aktuellen Alert-Status unbestätigt: die GitHub-Verbindung bietet weder Alert-Details noch Schließung; der erfolgreiche CodeQL-Upload allein beweist keine Befundfreiheit. Keine pauschale Unterdrückung oder Dismissal. Der Bergwetter-Test transportiert Parameter bereits getrennt über CDP-Argumente; der Browser-Endpunkt wird zusätzlich strikt auf den selbst gestarteten Loopback-Port begrenzt, ohne Wildcard-Origin-Freigabe. Die Transportgrenze wird mit gültigen/ungültigen Endpunkten und echtem Chromium-App-Render geprüft.

## Nachweise

- Produktionsbuild, Typprüfung und vollständige 905er-Regression.
- 18 tatsächliche 24h-/Tagesdetail-Geräte-/Theme-Fälle: alle Linienattribute, ECMWF Ein/Aus, eindeutige Gradienten, kein horizontaler Dokumentoverflow.
- 12 App-/Widget-Fälle: echte Quartile, astronomische Nachtflächen, Exportfarben, tatsächliches PNG und fehlende Mitglieder.
- Bergwetter: echter App-Render, sechs Viewports × zwei Themes mit abgesichertem CDP-Endpunkt.
- Produktionsaudit: keine HIGH/CRITICAL-Befunde; Abhängigkeitsvertrag unverändert. iOS-Asset-Kopie und Shell-/Lifecycle-Regressionsprüfungen.
- Workflow-Audit: keine HIGH/CRITICAL; sieben bekannte Medium-Hinweise zu Checkout-Credentials bleiben separat, ohne blinde Änderung benötigter Bot-Transportwege. Keine Schutzregel abgeschwächt und kein Bundle-Budget erhöht.
