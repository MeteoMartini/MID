# MID-C52 · Schneefall-Zeitbezug · unfreigegebener Kandidat

Basis .366 / 317a07ecb842d40de82d67c04abfb25ecfc8eaf0, Issue #515.

Reproduziert mit unverändertem dwdWarnings.ts: 168 Stunden ab 29.10.2026 19Z, einzige Schneestunde bei +60h (1cm) ergibt Hinweis ab jetzt bis 02.11.07Z. Reparatur bindet Schnee wie Regen an tatsächliche Niederschlagsintervalle; Vorwärtsfenster und Summen/Schwellen bleiben erhalten. Die probabilistische Präsentation darf das akkumulierte Schneeereignis nicht erneut über trockene Vorlaufstunden ausweiten. Tageszusammenfassungen verlangen tatsächlichen Schneefall am Tag.

Lokal Node24 Produktionsmodul geprüft: Schnee +60h, +4h, 35cm mit hoher Stufe, trockene Reihe und trockener Kalendertag bestanden. Sieben Vitest-Fälle hinzugefügt, deren Vitest-Lauf noch NICHT bestätigt ist. Weitere Gates offen: EPS-/Profilintegration, getrennte Episoden, fehlende Daten, existierende meteorologische Regressionen, Responsive Light/Dark, Types/Build/Audit. src/weather.ts muss über kanonischen Generator synchronisiert werden; Versionsspiegel/Changelog erst bei qualifiziertem vollständigem Releasekandidaten. Branchname benennt Zielversion, KEIN .367-Build veröffentlicht.

Hier kein vollständiger Checkout möglich: GitHub-Gittransport ohne Antwort, Git-Proxy ohne verfügbare Anmeldung, gh fehlt. Connector-basierte Source-Sicherung erlaubt, keine Zugangsdaten improvisiert. Draft bleibt nicht produktiv; niemals als non-draft freigeben, bevor Generatoren/Versionsspiegel und alle Gates vollständig sind. Source→Bot→ZIP→Installer→Worker/Pages→Stable unverändert erforderlich.
