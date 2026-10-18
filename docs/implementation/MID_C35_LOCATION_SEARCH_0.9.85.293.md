# MID-C35 · Ortssuche v0.9.85.293

## Verifizierte Basis und beobachteter Fehler

Freigegebene Basis main=mid-stable=7cfa80f16c7779e14a4b81ec8a060c46a39a9d09, v0.9.85.292. Installer 39135094553 einschließlich Worker, Pages und Finalisierung erfolgreich; öffentliche version.json und mid-build-identity.json HTTP 200, Buildquelle 1b087e79ff38a096525b3b622cfd6dcb44e9031f.

Vorher auf der produktiven .291 im echten Desktop-Chromium reproduziert: Suchliste y84–239, Standortleiste y100–132, 32px Überdeckung. Eine nach Escape abgeschlossene Suche nach Ouagadougou öffnete die bereits geschlossene Liste ohne erneuten Fokus. Die ausgewählte Teststadt blieb Barcelona. Diese Beobachtung ist keine physische iOS-Abnahme.

## Gemeinsame Zustandskorrektur

Header meldet den geöffneten Suchzustand an App. Währenddessen werden SelectedPlaceBar und deren Platzreservierung sowie das Body-Portal der schwebenden Hauptnavigation entfernt. Der Navigationsbaustein bleibt gemountet; Drawer-/Rail-Zustände werden nicht zurückgesetzt. Der VisualViewport-Anker ist währenddessen deaktiviert und wird beim Schließen neu angebunden. Keine bloße z-index-Verschiebung.

Nur ausdrückliche Fokus-/Eingabehandlungen öffnen die Suche. Weder Query-Effekt, Erfolg noch Fehler einer Antwort darf dies tun. Request-ID, AbortController und Debounce bleiben erhalten. Schließen beendet einen noch ausstehenden Fokus-Animationframe und führt Blur synchron aus. Der erste CI-Lauf deckte nach Escape einen echten Wettlauf zwischen verzögertem Blur und sofortigem Refokus auf (844×390); die Regression bleibt unverändert streng, ergänzt um abgeschlossenen Blur und echten ersten Touch-Tap. Escape, Auswahl, Klick und Fokus außerhalb stellen die Leisten wieder her.

React ist laut qualifiziertem Lockfile 19.2.8. Context7-Dokumentation /react/react/v19.2.8 wurde für gemeinsamen Elternzustand und bedingtes Portal geprüft. Keine Abhängigkeitsänderung.

## Prüfungen und ehrliche Grenzen

Pflichtregression scripts/test-location-search-layers-0985293.mjs in beiden Baseline-Listen. Sie bündelt die echten Header-/Navigations-/Standortleistenkomponenten und den echten VisualViewport-Anker; Wetter-/Speichergrenzen sind Stubs. Chromium ist in CI zwingend, lokaler fehlender Browser wird ausdrücklich als Skip ausgewiesen. Viewports 320×740, 390×844, 844×390, 768×1024, 1024×768, 1440×1000, jeweils Light/Dark, Touch und iPhone-UA: freie Suchfläche, Trefferprüfung, Overflow, Escape/Auswahl/Außenklick/Fokuswechsel, verspätete Antwort, Fehler und verkleinerter Tastatur-Viewport. Emulation ersetzt kein Safari/WKWebView/VoiceOver-Gerät.

Drei bestehende Quellregressionen wurden auf den absichtlich neuen gemeinsamen Zustand angepasst; bestehende Request-/Abort-/Fehler-Grenzen bleiben geprüft. Vollständige CI-/Releaseergebnisse müssen am tatsächlichen PR-Head bewertet werden. Lokaler Build/Regressionen separat im Arbeitsnachweis.

## Scope und verbleibende Arbeit

Nur Suchzustand und Releaseversion; universelle Warnungsimplementierung aus PR #414 unverändert übernommen, keine neue Meteorologie/RUC-Quelle. #411, #352, #374 und #405 bleiben offen. Originaler 26-Warnungen-Satz weiterhin nicht vollständig archiviert; vorhandene echte Livefälle sind kein Ersatz. RUC-Netz-/Hash-/Decoderprüfung und Skybar-Verbraucherabgleich sind getrennte Prüfbelege.

Veröffentlichung ausschließlich Source-Gate → bestehender SHA-Bot → Server-ZIP → install-mid.yml → Worker/Pages → Stable. Keine manuelle Promotion und kein allgemeiner PR-Mergehelfer.
