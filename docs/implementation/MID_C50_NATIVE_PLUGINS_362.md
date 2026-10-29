# MID-C50 · native Plugin-Patches · 0.9.85.362

Basis: veröffentlichtes .361, `main = mid-stable = 3b158eaf9634faa70c5c290da2171248dbf923bc`. Offene PRs vor Beginn geprüft: #474 gruppiert verschiedene unabhängig zu qualifizierende Bibliotheken; Drafts #425/#449/#480 überlappen nicht. #176 ist ein Brokerkanal, #246 schützt einzigartige Branchcommits; keine beiläufige Schließung/Löschung. #344 bleibt mit knapper CSS-Reserve und Browser-/Geräte-/Performance-Restprüfungen offen.

## Zusammenhängender Umfang aus #474

| Plugin | Stable | Kandidat | Upstream-Korrektur |
|---|---|---|---|
| @capacitor/app | 8.1.1 | 8.1.2 | iOS-Sprachtypwarnung |
| @capacitor/browser | 8.0.4 | 8.0.5 | browserFinished erst nach tatsächlichem Android-Custom-Tab-Ende |
| @capacitor/filesystem | 8.1.3 | 8.1.5 | Directory-Pfadbegrenzung und iOS-Datei-/Temporary-Korrekturen |
| @capacitor/geolocation | 8.2.2 | 8.2.4 | kompatible native Standortkorrekturen, u.a. Android-Fragment-Activity-Result |
| @capacitor/share | 8.0.2 | 8.0.3 | iOS-Systemdialog vom obersten Viewcontroller |
| @capacitor/status-bar | 8.0.3 | 8.0.4 | iOS-Retain-Cycle zur Bridge vermeiden |

Offizielle Release-Metadaten über GitHub REST `ionic-team/capacitor-plugins` (je Plugin-Tag), `ionic-team/capacitor-filesystem` v8.1.4/v8.1.5 und `ionic-team/capacitor-geolocation` v8.2.4 geprüft. Context7 `/websites/capacitorjs` verweist auf die offiziellen Capacitor-8-/SPM- und Filesystem-/Share-Sync-Verträge. Installierte Pakete verlangen Core >=8.0.0. Core/iOS/CLI bleiben gemeinsam auf 8.5.3; SplashScreen 8.0.2, React 19.2.8, MapLibre 6.7.0 und Lucide 1.40.0 unverändert. Kein neuer Datenprovider, kein meteorologischer Algorithmus, keine Lockfile-Übernahme aus dem alten Dependabotzweig.

## Reproduzierbarkeit und Abnahme

- `npm install --save-exact` löst sechs Pakete regulär neu auf; maschineller Lockfilevergleich mit Stable zeigt exakt diese sechs geänderten Paketpfade, keine zusätzlichen oder entfernten Einträge. Keine Overrides, keine erdachten Integritätswerte.
- Anschließend `npm ci --ignore-scripts --no-audit --no-fund`: 202 Pakete reproduzierbar installiert. Produktionsbuild samt TypeScript erfolgreich, 118 Assets.
- `cap sync ios` erfolgreich: sieben Plugins mit den vorgesehenen Versionen, bestehendes SPM-Paket byteidentisch, Webbuild in die native Hülle kopiert. Keine Signierung, kein Xcode-/Simulator-/physisches WKWebView-/VoiceOver-/Android-Geräteergebnis daraus abgeleitet.
- Neue ausführbare Regression `test-native-plugin-patches-0985362.mjs`: installierte Versionen, Peer-/SPM-Verträge und tatsächlich exportierte Pluginmethoden. Produktionsadapter werden mit kontrollierter Plugin-Grenze ausgeführt: byteidentischer Base64-Export, bereinigter Cachepfad, URI-Weitergabe, Cleanup auch beim Abbruch, Browser-WebShare ohne native Aufrufe, Einmal-Standort, Prompt, verweigerte Berechtigung ohne Browserumgehung und Verfügbarkeitsfallback. Mocks testen die JS-Grenze, nicht die OS-Implementierung.
- Bestehende fünf Native-/Shell-/Maintenance-Regressionen behalten sämtliche fachlichen Assertions; ausschließlich die bewusst aktualisierten exakten Pluginversionen wurden angepasst. Upgrade-Policy prüft zusätzlich alle sechs Pins und Lockfileauflösungen.
- Harte Buildbudgets erfolgreich: initial CSS 1.757.935 B roh / 249.520 B gzip-9 / 212.878 B Brotli-6; Text/Code insgesamt 1.833.895 B gzip, statische Medien 6.424.599 B. Keine Budgetänderung. Keine Netztransfer-/FCP-/Recalc-Messung daraus abgeleitet.
- `npm run audit:all` erfolgreich am HIGH-Grenzwert; drei bekannte moderate Dev-/iOS-CLI/xcode/uuid-Befunde bleiben upstream. Kein `audit fix --force` und keine pauschale Sicherheitsbefundfreiheit.
- Vollständiger lokaler Core und externe Source-/Heavy-/Installer-/Pages-Abnahme werden unten bzw. im PR mit aktuellem SHA dokumentiert. PR Completion übernimmt den Prüf-/Commit-/Beobachtungsvertrag; der CLI-Watcher ist ohne `gh` nicht ausführbar, GitHub-Connector liefert die Live-Gates. Keine alternative Landing-Aktion.

## Veröffentlichung und Restumfang

Nur autorisierter Source-PR → kompletter Source-Gate → SHA-gebundener MID-Bot → serverseitiges ZIP → Installer → benötigte Worker-/Pages-Gates → exakte Stable-Promotion. Vor diesem Nachweis unveröffentlicht. #474 bleibt offen für Lucide und die zurückgestellten React-/MapLibre-Meilensteine; bestehende Chunkbudgets bleiben bindend. Physische native Abnahme separat offen.

## Lokaler Abschluss

Der erste vollständige Corelauf hatte 1032/1034 Erfolge und genau zwei Infrastrukturfehler: in der erneuerten Work-Laufzeit fehlten `eccodes` und `requests`. Nach Installation ausschließlich der vorhandenen `tools/ruc/requirements.txt` bestand die erneut vollständig ausgeführte Suite **1034/1034 in 153,1 s**. Keine Änderung an den beiden RUC-Tests oder Produktivalgorithmen. Lokale Corechecks sind kein Ersatz für die externen Heavy-/Chromium-/WebKit-Gates; diese bleiben Pflicht. Build-/Versions-/Budget-/Audit-/iOS-Sync-Nachweise stehen oben. Remote-Source-Head und endgültige Veröffentlichung werden im PR SHA-gebunden ergänzt.
