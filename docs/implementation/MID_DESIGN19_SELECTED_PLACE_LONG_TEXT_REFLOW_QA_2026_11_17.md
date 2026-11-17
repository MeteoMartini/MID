# MID Design 1.9 – appweiter SelectedPlaceBar-Langtext-Reflow

**17.11.2026 · SOURCE-QA DRAFT, KEIN RELEASE**

## Verifizierte Grundlage und Pfadverantwortung

- GitHub `main=mid-stable=a78465b655d25cafc9ecc0390080694cb7aca957` · produktiv v0.9.85.486 synchron in `package.json`, `MID_BASELINE.json`, `contracts/index.json`, fünf aktive Branch-Rulesets. `AGENTS.md`, `MID_SOURCE_OF_TRUTH.md`, `MID_UI_ARCHITECTURE_CONTRACT.md`, `MID_CROSS_PLATFORM_CONTRACT.md` geprüft.
- Laufende Integration #868 und neuer Leitwork-Train #894 sowie Design-Drafts #891/#893 und Karten-#889 berühren vor dem Schreiben `src/SelectedPlaceBar.tsx` nicht. Diese Änderung arbeitet ausschließlich am vorhandenen gemeinsamen Komponententext mit eigenem Vitest und diesem Dokument; kein neuer CSS-Layer, kein Touch-/Scroll-/Map-Owner, keine zusätzliche Wetterlogik.

## Sichtbarer Designmangel aus Stable-Quelle

`SelectedPlaceBar` ist die kanonische ausgewählte Ortsanzeige für die Nicht-Karten-Hauptansichten. Der Name stammt aus dem aktuellen Ort bzw. der Favoritenbezeichnung und kann lang oder ohne natürliche Leerzeichen sein. Das Stable-Element `<strong title={name}>{name}</strong>` hat selbst keinen abgesicherten `min-width:0`-/`overflow-wrap`-Vertrag; es kann in engen Flex-/Grid-Anordnungen die intrinsische Spur verbreitern oder – bei nachlaufendem Container-Overflow – abgeschnitten erscheinen. Dies ist ein aus Originalquelltext abgeleitetes **Layout-Risiko**, kein behaupteter Browser-Screenshotbefund.

## Eng begrenzte Korrektur

- `<strong>` erhält eine statische, nicht pro Render erzeugte, rein layoutbezogene Style-Konstante mit `min-width:0`, `max-width:100%`, `white-space:normal`, `overflow-wrap:anywhere`, `word-break:normal`, `text-overflow:clip`. Lange deutsche Ortsnamen, Favoritenalias-Namen und untrennbare Unicode-Ortsnamen dürfen umbrechen, statt per Ellipsis Informationsgehalt zu verlieren.
- `role=status`, `aria-label`, unsichtbares Icon, `title={name}`, Anzeige `Standort` bei Tracking, Sichtbarkeit bei Suche/Map/Einstellungen und sämtliche Header-/Favoritenzustände **unverändert**. Keine erzwungenen Statusansagen oder zusätzlichen Effekte. Keine Wetterwerte, keine Einheiten, keine Warnstufen verändert.
- Kein neuer Listener, keine Timer, kein Network-Request und keine zusätzliche DOM-Tiefe; einzig das bereits gerenderte Textelement erhält sechs primitive Styles. Die Komponente bleibt rein funktional. Styles sind keine neue konkurrierende Design-Palette, sondern lokale Textintrinsik-Sicherung; bestehende globale Design-Tokens bleiben maßgeblich.

## Verifikation

`tests/unit/mid-design19-selected-place-visibility.test.ts` führt originales React-SSR dieser Komponente aus: vollständige Langnamen, ein 400+ Zeichen langer untrennbarer Orts-/Favoritenname, Unicode, Track-Status, leere/verborgene Suche, sichere HTML-Escapes, kein künstlicher Wetterwert und keine Event-/Storage-Owner. Diese Tests qualifizieren **Markup und Break-Policy**, nicht echte gerenderte CSS-Pixel oder eine physische iPhone-WebView.

Nach selektiver Integration im Leitchat zusätzlich 320/360/390/430/834/1024/1440px und Landscape, Light/Dark/High-Contrast testen: Ausgewählter Ort + Favoritenwechsel mit langem Alias, Tracked-Pill, Suchpicker offen/geschlossen, kleine Safe Areas, Browser-Zoom 200 %, Root-overflow, Textfragment-Clipping und exakte Touch-Reichweite. Die bestehende `scripts/test-location-search-layers-0985293.mjs`-E2E-Matrix darf nicht abgeschwächt werden. Map- und Settings-Ausnahmen müssen bestehen bleiben.

Exakte CI-Ergebnisse nur am endgültigen PR-HEAD lesen; keine automatischen Browser-/WKWebView-/VoiceOver-/WCAG-AA-/Performance- oder Releasefreigaben. Source/Core/Heavy/Review/ZIP/Installer/Worker/Pages/Stable bleiben unabhängig. #740/#839 und RUC bleiben unberührt.

Normative Nachweise: [MDN overflow-wrap](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-wrap), [W3C WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [W3C status role](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22.html).
