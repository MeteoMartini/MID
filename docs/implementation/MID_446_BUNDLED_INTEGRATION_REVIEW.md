# MID v0.9.85.446 – gebündelter Integrations-Draft (noch kein Build/Release)

**Source of Truth:** `main=mid-stable=b6526e7c5c24035bd1a75b87b77e7bb8e821c334` · `v0.9.85.445`. Exakter bislang nicht veröffentlichter Basistree `d4684d23661833f3df63edd22b07e022e35265a8`.

## SHA-sichere Komponenten

- PR [#700](https://github.com/MeteoMartini/MID/pull/700): `b2fbd0b1031dd26e38a867c4bd67ebebfb78a54c` · 8 Originaldateipfade, als unveränderte Git-Blobs kopiert
- PR [#684](https://github.com/MeteoMartini/MID/pull/684): `d83304d84d34589233f6c41a78d7b8b5f6490174` · 5 Originaldateipfade, als unveränderte Git-Blobs kopiert
- PR [#695](https://github.com/MeteoMartini/MID/pull/695): `2fbf469bf9a58afa76927a9e7c4cd3b703168eb6` · 5 Originaldateipfade, als unveränderte Git-Blobs kopiert
- PR [#698](https://github.com/MeteoMartini/MID/pull/698): `e9f14a9bacd190b052e40b1d3a5ac3b9aedd10ff` · 5 Originaldateipfade, als unveränderte Git-Blobs kopiert
- PR [#685](https://github.com/MeteoMartini/MID/pull/685): `f497466ac24cb75ed9b3a8b4df7fd4ee94699b70` · 20 Originaldateipfade, als unveränderte Git-Blobs kopiert

**43/43** Pfade disjunkt; die Original-Drafts, deren Branches, Reviews und CI bleiben erhalten. Keine direkte Änderung von `main`/`mid-stable`, keine neuen Secrets oder kostenpflichtigen Provider. Dieser neue Tree ist lediglich ein unabhängig überprüfbarer Sammelkandidat; der Source-PR-Gate wurde darauf **noch nicht** ausgeführt. Der aktuelle Paket-/Vertragsstand bleibt bis zur gezielten gemeinsamen Versionssynchronisation `0.9.85.445`: Der Branch ist nicht als neuer produktiver Build gekennzeichnet.

## Abnahmezustand und Blocker

- #700: Reale vollständige und partielle DWD-EPS20-Verzeichnis- und Pages-Prüfung bestanden; echte Writer-/168h/P95-/Endclient-Abnahme offen.
- #684: 3× Original-RUC-Lauf/GRIB/Bitmap/Wertprüfung lesend bestanden, keine 168h-Produktionsfreigabe.
- #695: 3×72 originale D2-Felder lesend bestanden, produktive Vollbereichs- und Clientgates offen.
- #698: Gebundene negative Healthgate-/P4-Tests bestanden, kein verteilter produktiver CAS/Fencing-Nachweis.
- #685: Core 4/4, Heavy 6/6 sowie Browser-/Responsive-Vorabtests auf ursprünglichem HEAD grün. Diese Einzelergebnisse gelten **nicht** automatisch für den Sammel-Tree; echte Originalphase-/Worker-Livereadbacks und physische iOS-Abnahme fehlen.
- Alle fünf PRs sind Draft und ohne formale unabhängige Genehmigung. #691 vs #698 bleiben eigene, nicht blind zusammengeführte Überlappung.

**Noch vor Release:** App-Version `v0.9.85.446` und alle Spiegel synchronisieren, Nutzer- und internes Changelog, vollständige gemeinsame Source/Core/Heavy/Browser-/Responsive-Pflichtgates, unabhängiger Review, Originaldaten-, Warn-, Fallback- und Client-Prüfungen und 168h/P95-Zulassung. Danach ausschließlich Source-PR-Gate → SHA-Bot → serverseitiges ZIP → `install-mid.yml` → Worker-/Pages-Gates → Stable-Promotion. Verfrühter CI-Erfolg ist kein Releasepass.
