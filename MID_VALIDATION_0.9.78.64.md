# Lokale Validierung – MID 0.9.78.64

Prüfdatum: 05.09.2026. Ausgangsbasis: bereitgestelltes ZIP 0.9.78.63; separate Arbeitskopie. Keine neuen Downloads, keine Deploymentaktionen.

| Prüfung | Ergebnis |
| --- | --- |
| Vollständige automatisch erkannte Regressionssuite | 682/682 Testskripte bestanden |
| Erneuter Lauf sämtlicher 23 gegenüber der Basis neuer/geänderter Testskripte nach den letzten Ergänzungen | 23/23 bestanden |
| Neue Audit-Verhaltenstests | Bestanden; Nullwerte, Temperaturindex-Invarianten, Median-Tails, Eventfenster/-abdeckung, Radarhorizont, AGL-/Druckbezug und CO₂-Priorität |
| TypeScript App und Node | Beide `tsc --noEmit`-Prüfungen bestanden |
| Vite-Produktionsbuild | Bestanden; 2678 Module transformiert |
| Worker-Syntax | `node --check worker/metar-proxy.js` bestanden |
| Generierte Aggregate | Erneute Modularisierungsprüfung bestanden; kanonische Fragmente und generierte Dateien stimmen überein |

Der Build meldet weiterhin große JavaScript-Chunks oberhalb der bestehenden 900-kB-Warnschwelle. Das ist kein Buildabbruch, bleibt aber ein Performance-Optimierungspunkt. Historische Tests wurden bei geänderten fachlichen Verträgen und Cachegenerationen aktualisiert; keine Tests wurden gelöscht.

Nicht durchgeführt: Live-End-to-End-Prüfung aller Wetterdienstanbieter, visuelle Geräteabnahme, Xcode-/iPhone-Lauf, Deployment und empirische Langzeitkalibrierung. Die Regressionen umfassen Strukturprüfungen und Verhaltenstests; ihre Anzahl ist kein Maß meteorologischer Vorhersagegüte.

## Paket

`MID-professional-replacement.zip` enthält den Quellstand mit synchronisierter Releaseversion, generierten Wetter-/Worker-Aggregaten, Tests und Dokumentation. Das vorhandene Verpackungsskript schließt installierte Abhängigkeiten, Buildausgaben und automatisch regenerierte iOS-Webassets aus. Der Zielworkflow muss den Webbuild und die iOS-Webassetübernahme wie bisher selbst ausführen. Das Paket installiert oder veröffentlicht nichts automatisch durch seine Erstellung.

Fachliche Begründung, Primärquellen und Grenzen: [Implementierungsbericht](MID_IMPLEMENTATION_0.9.78.64.md).
