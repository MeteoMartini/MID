# MID v0.9.85.259 · RUC-Pilot ohne zusätzliche Python-Laufzeitabhängigkeit

- Der begrenzte verlustfreie RUC-Pilot benötigt für Byteplane-gzip ausschließlich die Python-Standardbibliothek. Ein unnötiger Import diagnostischer NumPy-Helfer blockierte zuvor die unabhängige Installer-Prüfung von .258.
- Der End-to-End-Test läuft jetzt ausdrücklich ohne Python-Site-Packages. Rohdaten, Prüfsummen, Speicherbudget, Abschaltung und Rückfall bleiben unverändert.
- .258 wurde durch das fehlgeschlagene Installer-Gate nicht veröffentlicht. Dieses Release enthält den vollständigen geprüften Pilot einschließlich Body-Deadlinekorrektur; produktive Aktivierung ist weiterhin separat an einem echten RUC-Lauf nachzuweisen.
