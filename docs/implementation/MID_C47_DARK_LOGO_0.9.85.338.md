# MID-C47 · Dunkles horizontales Logo · .338

Basis: main = mid-stable = d080fe240d5a59a5a77467c783aba59a33957ddc (.336).
Selektiv übernommen aus PR #472, Head 346084ca7a90f364edf5becf8751d7ce0186a9b0: ausschließlich dunkles horizontales PNG und zugehörige Hash-/Dimensionsregression. Alte Versionsänderungen nicht übernommen. .337 bleibt dem SYNOP-Draft #480 vorbehalten.

Das PNG ist byteidentisch zum Nutzerupload MID-logo-dark-assets(1).zip / MID-logo-dark-horizontal.png: SHA256 62435a0b4e03faeb719717c36ef8ad24937e9e1be3b62025723a4d3b4a138bd6; 2048 × 768. Bestehende Boot-/Theme-/Offline-Pfade bleiben erhalten.

Lokal bestanden: npm ci, Produktionsbuild einschließlich Types, Logo-/Theme-Assetregression, native PNG-Integrität, Cross-platform-iOS-Shell, Versionierung, Release-Lineage und Performancevertrag. Dies ist keine physische iOS-/VoiceOver-Abnahme.

Erster Regressionlauf erkannte doppelte historische und neue dist/assets/index-JS-Dateien. Der Ausgabeordner wurde gesichert und sauber neu aufgebaut; Budget separat erneut prüfen. Breite Regressionen und GitHub Source-/Heavy-/Installer-/Worker-/Pages-/Stable-Gates sind vor Veröffentlichung erforderlich. Kein Release behauptet.

Nachprüfung: vollständiger lokaler Lauf 1024/1024 erfolgreich. Zusätzliches Gesamtbudget zunächst 8509894 > 8500000 B. PNG verlustfrei mit Pillow optimize=True/compress_level=9 neu kodiert: 1381015 → 1268989 B; identische RGBA-Pixel einschließlich Alpha (SHA256 5ca2b261c5e8c366ed6a7d9ee20654ba4592b2d58218ad9bf6da7d55504b3bf7). Quelldatei-Hash oben bleibt Provenienznachweis; ausgelieferter PNG-Hash d66e9033b7512f088562917dded446681911ff975307342d6b3d7da0e4e9123a. Keine Skalierung, Quantisierung oder Farbänderung. Budget nach Neubuild erneut prüfen.
