# MID-C47 · Erster begrenzter CSS-Split · .339

Basis: veröffentlichtes Stable .338, main=mid-stable=ed934fb0e755e54e0e4a553b8c47d44f7a59c262. Alter .338-Workspace bleibt unverändert erhalten; Arbeit in eigenem Worktree. Keine Übernahme älterer Versions-/RUC-/Workflowänderungen aus dem CSS-Diagnose-Draft #463.

## Fach- und Kaskadengrenze

Die irreführend benannte midC28MapPhase.css enthält ausschließlich die nach data-fourteen-development begrenzte 14-Tage-Entwicklungsansicht. Sie ist der letzte bisherige eager Kaskadenabschnitt. Dieser unveränderte Abschnitt wird zusammen mit dem unveränderten FourteenDayDevelopment-Renderer asynchron geladen. Der Canonical-Series-Übergabepfad bleibt erhalten. Der bestehende Suspense-Mechanismus zeigt einen zugänglichen Ladezustand. Keine Umrechnung, Rundung, Wetterwerte, Unsicherheit, Warnungen oder Worker-Fachlogik geändert. Versionsspiegel werden regulär synchronisiert.

Die übrigen 69 eager Quellen behalten ihre Reihenfolge und die .169-Golden-Fingerprints. Nur die ausdrücklich beabsichtigte neue Ladegrenze ersetzt die frühere Last-Entry-Assertion; keine Layout-, Pixel-, Missing- oder Budgetassertion gelockert. Neue Regression ist exakt einmal im bestehenden Heavy-Browser-State-Shard enthalten; vollständige Partition weiterhin geschützt. CI installiert Chromium und WebKit und fordert beide Produktionsvergleiche vor Release.

## Prüfung und Grenzen

Lokaler Produktionsbuild/Types, Gesamtbudget, unveränderte Fachtests, Versionierung, Release-Lineage und vollständige Suite 1025/1025 erfolgreich. Produktionsfixtures: 7 Viewports (320/390/430/844/834/1194/1440, Hoch-/Querformat), Light/Dark/High Contrast, cold/warm, Chromium 42/42. Exakte PNG-Screenshot-Pixel, computed style/layout, SVG-Geometrie und zugängliche Daten, Tastaturauswahl, Overflow, keine Laufzeitfehler. Nachweis des warmen CSS-Caches und keine Modul-CSS-Anforderung vor Öffnung. WebKit zusätzlich erforderlich; bis zum tatsächlichen Ergebnis nicht als bestanden werten. Keine physische Safari-/WKWebView-/VoiceOver-Geräteabnahme und keine vollständige App-/Widget-/Exportabnahme behauptet. Der Renderer besitzt nur einen Produktionsverbraucher; andere gemeinsame Komponenten/CSS bleiben eager/unverändert.

Gleiche lokale Toolchain, sauberer Stable-Referenzbuild: initiales CSS 1759985 → 1756829 B (-3156), gzip-9 249702 → 249397 B (-305). Initiale index-JS-Summe 1478169 → 1471006 B (-7163). Lazy CSS 3157 B/664 B gzip. Keine Behauptung gemessener Netzkompression, LCP/INP oder realer Gerätebeschleunigung. Geringfügiger Split-Overhead bleibt in unveränderten Gesamtbudgets.

Dies ist ein kleiner isolierter erster Schritt; die größere Bergwetter-/Widget-/Extremwetter-CSS-Auslagerung, alle 19 Dashboardmodule und der Diagnose-Draft #463 bleiben offen. Vite dokumentiert CSS-Laden vor Ausführung eines asynchronen Chunks; das ist allein kein Kaskaden-/Pixelbeweis (https://vite.dev/guide/features.html#css-code-splitting).

Source-Gate, kontrollierter MID-Bot-Merge, Server-ZIP, Installer, Worker/Pages und Stable-Promotion stehen aus. Kein generischer PR-Completion-Merge. Kein .339-Release behauptet.
