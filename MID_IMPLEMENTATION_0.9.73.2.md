# MID v0.9.73.2 — RUC Pages bootstrap restore hotfix

## Anlass
Nach Aktivierung von `MID_RUC_PIPELINE_ENABLED=true` blockierte der normale Pages-Release beim allerersten RUC-Bootstrap, weil `/ruc/latest.json` erwartungsgemäß noch HTTP 404 lieferte und `restore_ruc_pages_snapshot.py --required` diesen Zustand als fatal behandelte.

## Umsetzung
- HTTP 404 für `/ruc/latest.json` wird als expliziter First-Run-/Bootstrap-Zustand behandelt und lässt den normalen MID-Pages-Release ohne `ruc/` fortfahren.
- Andere HTTP-Fehler bleiben bei aktivierter Pipeline fail-closed.
- Netzwerk-/Transportfehler, ungültige Manifeste und fehlerhafte Chunks bleiben unverändert fatal, sobald `--required` aktiv ist.
- Die bestehende Pages-Free-, Worker- und Modellfusionsarchitektur bleibt unverändert; R2 bleibt deaktiviert.

## Regression
`test-ruc-pages-free-storage-09700.mjs` prüft nun zusätzlich den Bootstrap-404-Vertrag und die fail-closed-Behandlung anderer HTTP-Fehler.
