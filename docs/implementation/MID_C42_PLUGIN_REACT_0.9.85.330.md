# MID v0.9.85.330 · Isolierte Qualifizierung von @vitejs/plugin-react 6.1.2

Ausgangsbasis ist Stable v0.9.85.329, SHA `85f98cc3a347657071eef0a18aee4f0345d26ed7`. Ausschließlich das Entwicklungs-Plugin `@vitejs/plugin-react` wechselt von 6.1.1 auf 6.1.2; React 19.2.8, Vite 8.2.4, Capacitor 8.5.2, MapLibre 6.7.0, PostCSS 8.5.31 und Pako 2.2.0 bleiben separat fixiert.

Registry-Metadaten: 6.1.2, tarball `https://registry.npmjs.org/@vitejs/plugin-react/-/plugin-react-6.1.2.tgz`, integrity `sha512-fhJNGUdscQa4HkI0xFxwonWyhnVReCPDbXI7FH7jmzpnVCrFQI7PRrhWecO263610vOrs9tr2Y4xcf8uAdFxbw==`; Peer `vite: ^8.0.0`, optionale `oxc-transform-react: ^0.152.0`, Node `^20.19.0 || >=22.12.0`. Upstream nennt als 6.1.2-Änderung einen HMR-Fix für Compound Components. Das erneuerte Lockfile hat nur die Plugin-Metadaten geändert.

Context7 bestätigt die aktuelle Vite-8-Kompatibilität und Node-Anforderungen, führt aber 6.1.2 nicht in der Versionsliste. Die exakte Version wurde deshalb zusätzlich anhand der offiziellen Upstream-Veröffentlichung und npm Registry geprüft.

Vor Source-PR sind reproduzierbare Installation, Typecheck, Produktionsbuild, vollständige Regressionen, Dependency-/Security-Audits, CSS-/Performance-Contracts und iOS-/Release-Vorprüfungen zu absolvieren. Die Produktions-CSS-Ausgabe ist im Build gegen .329 auf Byte-Parität zu prüfen. Kein CSS-Split und keine unabhängigen Dependency-Upgrades in diesem Schritt.
