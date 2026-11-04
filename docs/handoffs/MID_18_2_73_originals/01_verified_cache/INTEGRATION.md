# RUC-/ICON-Karten-Warmstart, konservativer Cache

**Basis:** SHA `4d3051f80a17a180c3952c83bf5afa51623b1eb3`, v0.9.85.427. **Status:** pure Cache-Komponente & isolierte Tests erfolgreich, noch keine Appintegration, kein Freigabegate.

## Ausgeführte Änderungen im Paket

`src/verifiedMapFrameCache.ts` bietet `fetchVerifiedMapFrameBytes(path,sha256,byteCount,signal)` für *unveränderliche* per SHA256 + Länge identifizierte Dateien unter `/ruc/runs/<run>/(model-fields|model-fields-native|ruc-model-fields|model-fields-ruc)/...`. Lauf/Termin und Quellenmetadaten kommen **immer** aus einem frisch abgefragten und validierten Index. Frische `/ruc/latest.json?mid_fields=...` und die CAS-Fencing-/Signaturkette bleiben UNBERÜHRT.

- RAM + browserinternes CacheStorage, 20-Minuten-Reuse, max. 24 MiB Gesamtbudget, 12 MiB pro Antwort, 18 Items, LRU/FIFO-ähnliche Altersbereinigung. Kein `localStorage`-Blob, keine Auswirkung auf Favoriten oder andere User-States.
- Antwort wird bei jedem Cache-Hit erneut am aktuellen Index-Hash und an der angekündigten Bytelänge geprüft. SHA-Mismatch, korruptes Cachedatum, gekürzter Stream, URL-Drift, Cache-Eviction: **keine** Stale-Fallback-Freigabe, frischer SHA-geprüfter Netzabruf oder Fehler.
- Wenn `CacheStorage` (z.B. private iOS WebView) ausfällt, läuft die normale direkte Datenstrecke weiter; vollständige Offline-Neueröffnung wird ausdrücklich **nicht** garantiert.

## Integrationsschritte im autorisierten Branch

1. Gegen `rucNativeMapIndex.ts`, `nativeModelFields.ts`, `nativeSynopticFields.ts`, `CloudSignificantWeather.tsx` die realen Manifest-`base+ref.file`-Pfade aller Varianten prüfen. `safeFrameUrl` Whitelist gegebenenfalls explizit und getestet erweitern; niemals generische absolute URLs, Query-Parameter oder Seitenpfade freigeben.
2. `src/verifiedMapFrameCache.ts` übernehmen; in `nativeModelFields.ts::loadNativeField` **ausschließlich** das bisherige `fetch(...).arrayBuffer()` durch `fetchVerifiedMapFrameBytes(base+ref.file,ref.sha256,ref.bytes,signal)` ersetzen. `validateNativeField`, Gzip-Decoder und Prüffelder erhalten. Optional separat im eingebetteten synoptischen/Cloud-WW-Pfad, nur nach exakt gleichen Gates. Die `latest.json`-Prüfung bleibt `no-store` und bekommt niemals Cache-Fallback.
3. In der Unified-Karte den komponentenlokalen `fieldCache` als sekundäres LRU belassen oder auf den verifizierten Transport reduzieren; bei `revision` invalidieren, ohne CacheStorage anderer Nutzerzustände anzufassen.
4. Vor dem letzten App-Schließen / schnellen Wiederöffnen messen: nur Index-/Pointer neu, bereits geprüfte Original-Feldbytes nicht; neue `run`, geänderte `sha256`, falsche `bytes`, abgelaufenes TTL, kaputtes CacheEntry erzwingen echte sichere Refetches.

**Muss-Tests:** Cache poisoning, Hash-Kollision / fehlender crypto.subtle, offline & cached / offline & uncached, Snapshot-Wechsel in ≤20min, alter Lauf mit identischer Filename but anderem SHA, `AbortSignal` bei Hit/Miss, iOS WebView Quota/Safe-Area, paralleler identischer Abruf, max. Request-/Speicherbudget und vollständige RUC 27h/EPS20-Domänenqualität. Keine persistierte hyperlokale Ortskoordinate als Cache-Key ohne Standort-Datenschutzprüfung; hyperlokale Fusion getrennt und nur enges opt-in, sofern nötig.
