# MID-C29 · v0.9.85.243

Basis: main=mid-stable 672d901f603238d61f36f508162b39368ed9ba7a (.242), keine offenen Source-PRs bei Beginn. Replit .195 ausschließlich beratend, keine alte Implementierung übernommen.

Sortierung ergänzt validierte durable v1-Präferenzen ohne Migration alter Profil-/Radius-/Zeitraumdaten. Standard input order entspricht Einstellungen; native numerische Werte, stabile Gleichstände und Missing/Stale-last. Warnsortierung bewahrt bestehende Prioritätslogik. Vergleich bleibt quality-first, wirkt als vertikale Rangliste; Übersicht als kompakter Kartenraster. Labels wurden bewusst aktualisiert, bestehende Browserassertions behalten ihre Verhaltensprüfung.

Zentrale presentation-only Parameterformatierung, SYNOP/MID-Abgrenzung im registrierten Präzisionsvertrag. Shared precipitation/wind/visibility renderer plus relevante direkte Verbraucher (Aktuell, ForecastCockpit, Detailprimitives, Kurzfrist, Ensemble, Bergwetter, Wassersport, Karten und Verifikation); Saisonanomalien maximal Zehntel. Es erfolgt keine Rundung der kanonischen Werte oder Änderung von Schwellen, Reconciliation oder Quellen.

Kleine Niederschläge bleiben positiv erkennbar, keine negative Null, konservative Sichtweitenstufen. Gleiche gerundete Temperatur-Endpunkte werden zusammengefasst. Koordinaten, Geometrie, quantitative Verifikationsscores und Achsenticks behalten ihre unabhängigen Präzisionsverträge. Neue Boundary-/Sortierfixtures sowie Reload-/Viewport-Browserprüfungen schützen den tatsächlichen Vertrag; geänderte alte Assertions werden nur dort angepasst, wo der neue dokumentierte Anzeigevertrag sie ersetzt.

Physische iOS/WKWebView/VoiceOver-, vollständige wissenschaftliche E2E-/Naht- und Langzeit-SLO-Abnahmen bleiben offen. Veröffentlichung ausschließlich durch Source-Gate und Installer.

Prüfevidenz: reproduzierbares npm ci, TypeScript7, sauberer Vite-Produktionsbuild, Dependency-Audit ohne HIGH/CRITICAL, iOS-Hülle und Offline-/Resume-Regression bestanden. Bundle 1427587/1500000 JS-Bytes, CSS unverändert 1759989/1760000; keine Budgetlockerung. 16 App-Browserfälle plus 24 Classic/Next-Komponentenfälle (Portrait/Landscape, Light/Dark); zusätzliche finale 320/1536-Screenshots visuell geprüft. Kleine Displays erhalten volle Sortierbreite und Warnstatus vor dem Ortsnamen. Physische Geräte bleiben ungeprüft.

Historische golden hashes werden ausschließlich für fünf Präsentationsdeklarationen aktualisiert (mountainSnowLinePrecipPeriods, MountainSnowLineTrend, MountainSki, MountainForecastDayRow, visibilityLabel); vorherige Hashes, Änderungsgrund und Vertragsrevision bleiben in der Fixture erhalten. Keine Änderung der ursprünglichen CSS-Kaskade oder numerischer Rechnungen. Alte Format-Tokenchecks behalten ihren Umfang, verlangen aber den neuen Formatter/Label. Vollständige Suite muss weiterhin grün sein.

Lokales doppeltes index-Bundle entstand durch mehrere Builds ohne leeren dist-Ordner; ein sauberer Neuaufbau bestätigt unveränderte Budgets. Keine generierten dist-Dateien werden im Source-PR transportiert; der Server baut das Release aus Source.
