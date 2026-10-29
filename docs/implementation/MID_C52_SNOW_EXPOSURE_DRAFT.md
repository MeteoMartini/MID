# MID-C52 · Schneezeitbezug · Source-Kandidat .367

Basis .366 317a07ecb842d40de82d67c04abfb25ecfc8eaf0. #515 / #516.

Unverändertes Produktionsmodul erzeugte für eine einzige Schneestunde bei +60h ein Fenster ab jetzt bis über +72h. warningOccurrence bindet Schnee nun an tatsächlich schneeführende Akkumulationsintervalle, Summenwerte und Stufen bleiben erhalten. Die probabilistische Präsentation übernimmt diese Grenzen ohne erneute Ausdehnung durch vorwärts summierte Schneeunterstützung. Tagesansichten verlangen passende Schneestunden. weather.ts enthält denselben Fragmentstand. Versionsspiegel synchron .367.

Fünf lokale Produktionsmodul-Fälle erfolgreich. GitHub Vitest Run40954639576, Job123731434590 bestätigt sieben neue Tests auf b630a823ad1acb62df0f518f505ef36a0b3df8a6. Neuer versionierter Head benötigt frische Source-/Unit-/Core-/Heavy-Gates. Browser-/Responsive-/EPS-Gesamtnachweis bislang NICHT bestätigt. Keine tatsächlichen historischen Rohdaten des Nutzergeräts. Keine amtliche Warnlogik oder Meteorologiemenge geändert.

Lokaler vollständiger Gittransport nicht verfügbar; GitHub-Connector liest/sichert SHA-gebundene Quellen, npm wieder erreichbar. Produktionsfreigabe ausschließlich über bestehendes Source-Gate und SHA-Releasebot → ZIP → Installer → Worker/Pages → Stable. PR Completion ausschließlich Prüf-/Reparaturrolle. Kein generischer Merge.
