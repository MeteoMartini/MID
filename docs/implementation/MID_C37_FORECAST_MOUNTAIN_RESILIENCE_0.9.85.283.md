# MID 18.2.37 · v0.9.85.283 – Standortwechsel und Höhenprofil-Netzwerkstabilität

**Basis (vor Änderungen):** `main=mid-stable=b02d1b018882807fbce114cf6816f520f52339d1`, freigegebene v0.9.85.282 nach Installer #39038958909. Issue #398; vom Nutzer bereitgestellte Screenshots Sölden (langsamer Modell-Loader und „Fetch is aborted“). Eigener Branch `chatgpt/v0.9.85.283-forecast-mountain-resilience`. Kein konkurrierender offener Produkt-PR bei Arbeitsbeginn.

## Ursache und technische Abhilfe

1. `App.setLoc` setzte die Kernprognose auch bei bereits besuchtem Ort sofort auf `null`. Der vorhandene validierte Cache wurde erst als Netz-Fallback eingebunden. `instantCachedCoreForecast` verwendet nun ausschließlich einen exakten Ort-/Höhen-/Zeitzonen-Schlüssel (keinen 2,5-km-Nachbarcache), maximal 45 min alt, unter Beibehaltung der Best-Match-Validierung und des `_mid_core_proxy`-Alters/Freshness-Nachweises. Spätere Netzwerkantworten bleiben an die Standortsequenz und ihr AbortSignal gebunden. Bei leerem Cache bleiben echte Lade-/Fehlerzustände sichtbar.
2. `mountainSportsForecast` wartete bislang mit `Promise.all([basePromise,regionalPromise])` auf das optionale Regionalmodell. Die vollständige Best-Match-Mehrpunkthöhenprognose wird nun zuerst validiert, veröffentlicht und zwischengespeichert. Regionalmodelle werden ausschließlich als spätere Enrichment-Stufe abgerufen, zeitlich zugeordnet, meteorologisch nachgerechnet und einschließlich Quellennutzung und Status aktualisiert. Bei Fehlern bleibt Best Match als überprüfbare Basis erhalten.
3. Der gemeinsame Mehrpunktabruf erhält ein begrenztes Zeitbudget und einen ebenfalls begrenzten Einzelhöhen-Retry ausschließlich mit demselben vollständigen Variablensatz. Kein Retry nach expliziter Nutzerabbruch-Signalisierung oder HTTP-429. Fehlende Höhenprofile oder nicht identische Stundenachsen/Zeitzonen führen fail-closed zur verständlichen Fehlermeldung und manueller Retry-Möglichkeit. Keine stillschweigende Null- oder Modellsubstitution.

## Abnahmematrix und Abgrenzung

- Kalt-/Warm-/abgelaufener exakter Cache, Höhen-/Zeitzonenwechsel, benachbarter aber anderer Ort, 45-min-Grenze, Rate-Limit, Offlinezustand, Ortswechsel während Requests.
- Höhenabrufe bei schneller/langsamer/abgebrochener Best-Match-Route; volle Feld-/Stundenabdeckung über alle Höhen; Regionalantwort vor/nach oder ohne Folgeantwort; bereits gestarteter Request nach Navigationswechsel; Snow-/UTCI-Neuberechnung.
- 90 min/24 h/7 d/14 d und Bergwetter, Smartphone hoch/quer, Tablet hoch/quer, Desktop, Light/Dark, Touchziele und Focus/Overflow. Echte iOS/WKWebView/VoiceOver-Abnahme nur mit tatsächlicher Geräte-Evidenz.
- Neue Pflichtregression `scripts/test-location-mountain-resilience-0985283.mjs` ergänzt historische Testmatrix; bestehende Tests werden nicht deaktiviert. Browser-/CI-Evidenz und reales Netzprofil strikt unterscheiden.

**Veröffentlichung:** ausschließlich Source-PR-Gate → kontrollierter SHA-Bot-Merge → serverseitiges ZIP → `install-mid.yml` → Worker/Pages → Stable-Promotion. Dieses Dokument ist bis zum abgeschlossenen Gate ein Quellkandidat und kein Release-Nachweis.
