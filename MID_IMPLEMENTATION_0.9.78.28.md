# MID 0.9.78.28

## Wartungsbereinigung ohne Funktionsabbau

- Die beiden veralteten TypeScript-Inkrementaldateien `tsconfig.app.tsbuildinfo` und `tsconfig.node.tsbuildinfo` aus TypeScript 5.8.3 wurden entfernt. `.gitignore` und der Professional-Release-Packer verhindern ihre erneute Auslieferung. Auch das ausschließlich lokal beziehungsweise in CI erzeugte Verzeichnis `artifacts/` wird nicht mehr in den Quelltransport aufgenommen.
- 33 exakt redundante CSS-Regeln innerhalb ihrer jeweiligen kanonischen CSS-Quelldatei wurden entfernt. Dabei blieb jeweils die spätere, kaskadenwirksame identische Regel erhalten; Selektoren, Deklarationen, Media-Kontexte und sichtbare Funktionen bleiben unverändert.
- Die sieben bewusst deaktivierten Altmodule für Routenwetter, Synoptik und die verworfene DWD-Rekonstruktionspipeline bleiben als dormant, regressionsgeschützte Referenz erhalten. Es wurden keine reaktivierbaren Fachbestandteile gelöscht.

## Performance und Handling

- Der Minutentimer der Ansicht „Aktuell“ verwendet nur noch das bereits gecachte Sonnenfenster für Sonnenauf- und -untergang. Die deutlich aufwendigere Sonnen-, Mond- und Finsterniszusammenfassung läuft nicht mehr jede Minute, sondern wird für die Detailanzeige memoisiert und höchstens stündlich aktualisiert.
- Die 1-h-/3-h-Schalter im 24-h-Wetterprofil erhalten auf iPhone und anderen Grobzeiger-Geräten dieselbe verlässliche 36-px-Trefferhöhe wie die benachbarten kompakten Bedienelemente. Die optische Desktopdichte bleibt unverändert.
- MapLibre GL JS 6.7.0 übernimmt die kompatible Optimierung gegen unnötige Symbol-Neuplatzierung bei unverändertem Kamerastand sowie aktuelle Tile-/Terrain-Korrekturen.
- Capacitor 8.5.1 aktualisiert Core, iOS und CLI gemeinsam. Enthalten sind unter anderem robustere Listener-Entfernung, korrigierte POSIX-Pfade für das iOS-SPM-Paket und ein Schutz des internen HTTP-Proxy-Pfads.

## Bewusst unverändert

- React 18.3.1, Recharts 3.10.1, Vite 6.4.3, `@vitejs/plugin-react` 4.7.0 und TypeScript 7.0.2 bleiben auf dem freigegebenen Stable-Vertrag.
- Der bekannte moderate `uuid@7.0.3`-Auditbefund liegt weiterhin ausschließlich im Dev-/iOS-Toolingpfad von `@capacitor/cli -> xcode`. Ein inkompatibles Override oder Downgrade wird nicht erzwungen.
- Browser, PWA und Capacitor-iOS verwenden denselben React-/Vite-Fachkern. Es gibt keine fachliche Workeränderung und keinen erforderlichen Worker-Upload.
- Stable-Branch-Schutz, Release-Evidenz und die vorhandenen Karten-, Radar-, Forecast-, Export-, PWA- und iOS-Verträge bleiben erhalten.
