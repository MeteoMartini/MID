# MID 0.9.78.27

## Release-/CI-Hotfix nach GitHub-Lauf #863

Der Installerlauf #863 erreichte erfolgreich npm ci, Dependency-Audit, TypeScript und den vollständigen Vite-Produktionsbuild. Von 651 Regressionstests scheiterte ausschließlich `scripts/test-stable-audit-20260810.mjs`.

Ursache war ein veralteter Stable-Audit-Textvertrag: Der Test erwartete noch die frühere Formulierung „Saisonmodelle ausdrücklich aktualisieren“, während die inzwischen umgesetzte Trends-14-d+-Informationsarchitektur die eigenständige Untersektion **Saisonvorhersagen** verwendet und der Refresh-Button entsprechend „Saisonvorhersagen ausdrücklich aktualisieren“ heißt.

Der Audit wurde ohne Abschwächung des Funktionsvertrags auf die aktuelle Struktur synchronisiert. Er prüft weiterhin den bewussten `load(true)`-Refresh und zusätzlich explizit die `seasonal-forecast-subsection` sowie die sichtbare Kennzeichnung `SAISONVORHERSAGEN`.

## Fortgeltender UI-Vertrag

Die Änderungen aus v0.9.78.26 bleiben enthalten: Skybar in der Tagesansicht, gerundete Segmente, getrennte Sonne-/Bewölkungsgrundfarbe und Niederschlagsüberlagerung ohne Farbmischung, Nachtstunden in der 7-Tage-Kurvenübersicht sowie ersatzlose Entfernung des dortigen P25–P75-Bands.

## Plattformvertrag

Browser, PWA und Capacitor-iOS verwenden weiterhin denselben React-/Vite-Fachkern. Der Hotfix enthält keine neue fachliche Worker-Logik.
