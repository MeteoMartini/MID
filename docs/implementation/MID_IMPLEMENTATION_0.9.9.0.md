# MID v0.9.9.0

## Ausgangsbasis
- Verbindlicher Branch: `mid-stable`
- Pflichtprüfung: `package.json` und `MID_BASELINE.json`
- Bestätigter Stable-Stand vor Umsetzung: v0.9.7.1
- Die betroffenen Cockpit-Quelldateien wurden über Git-Blob-SHAs gegen `mid-stable` verifiziert.

## Suchmaschinen-Discoverability
- Selbstreferenzierende Canonical-URL `https://www.midwx.app/`
- Aussagekräftiger deutscher Seitentitel und Meta-Description
- `robots`/`googlebot`: index, follow und große Bildvorschau
- Open-Graph- und Twitter-Metadaten
- Schema.org `WebApplication` als JSON-LD
- `public/robots.txt` mit Sitemap-Verweis
- `public/sitemap.xml` mit ausschließlich der kanonischen URL
- `public/CNAME` für `www.midwx.app`
- statischer, lesbarer No-JavaScript-Fallback
- Manifest-ID, Start-URL und Scope auf `/` vereinheitlicht

## Responsive Cockpit-Reparatur
- Icon, Titel/Zusammenfassung und Mini-Ribbon liegen in festen CSS-Grid-Areas.
- Titel bleiben in einer Zeile; Zusammenfassungen werden kontrolliert auf zwei bzw. mobil eine Zeile begrenzt.
- Separate Rasterregeln für einen, zwei oder drei aktive Prognosehorizonte.
- Desktop-, Tablet- und Smartphone-Breakpoints überarbeitet.
- Auf schmalen Displays kann die Registernavigation kontrolliert horizontal scrollen.
- Klassische Darstellung bleibt Standard und wird von den Cockpit-Regeln nicht verändert.

## Versionierung
Funktionsrelease v0.9.9.0, da neben einer responsiven UI-Reparatur eine vollständige technische Suchmaschinen- und Domain-Discoverability ergänzt wurde.

## Worker
Keine funktionale Worker-Änderung. Nur Versionssynchronisation.
