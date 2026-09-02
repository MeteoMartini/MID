# MID Test Report v0.9.77.19

Stand: 2026-09-02

## Gegenstand

MID v0.9.77.19 schließt drei zusammengehörige Punkte des laufenden Releasepfads ab:

1. Der aktuelle Temperatur-Messanker wird zwischen den Stunden nicht mehr auf genau einen Stundenpunkt geschrieben. Der Modellwert wird am tatsächlichen Beobachtungszeitpunkt interpoliert, die Korrektur auf beide umschließenden Stunden gelegt und davor/danach mit einer glatten S-Kurve ausgeblendet. Damit verwenden 24-h-Wetterprofil, Tagesansicht und weitere kanonische Stundenverbraucher denselben kontinuierlichen Verlauf.
2. Die mit v0.9.77.18 hinzugekommene KNMI-HARMONIE-EPS-Workerstufe wird produktiv an den kanonischen Workerpfad gebunden. Der Worker-Aggregatvertrag enthält nun auch `worker-src/05-knmi-eps-cache.js`.
3. Der reale GitHub-Installerlauf #828 scheiterte ausschließlich an der veralteten Modularisierungsregression, die dieses neue Worker-Modul beim Soll-Aggregat noch nicht mitzählte. Der Test ist auf den tatsächlichen kanonischen Aggregatpfad aktualisiert.

## Lokal erfolgreich ausgeführt

- `node scripts/test-current-temperature-smooth-bridge-097719.mjs`: PASS
  - Current-Wert wird am echten Beobachtungszeitpunkt exakt getroffen.
  - beide umschließenden Stunden tragen denselben Bias statt einer isolierten Einzelstunden-Delle.
  - Übergang vor/nach dem Current-Anker wird weich ausgeblendet.
  - gefühlte Temperatur erhält denselben thermischen Versatz.
  - Dashboard und Eventpfad verwenden den standortlokal interpretierten Current-Zeitstempel.
- `node scripts/test-maintenance-modularization-09560.mjs`: PASS
  - `worker-src/05-knmi-eps-cache.js` ist Bestandteil des kanonischen Worker-Aggregats.
  - `worker/metar-proxy.js` und `worker.js` entsprechen dem kanonischen Teilquellen-Aggregat.
- `node scripts/test-knmi-eps-worker-binding-097719.mjs`: PASS
- `node scripts/test-knmi-eps-productive-cache-097718.mjs`: PASS
- `node scripts/test-versioning.mjs`: PASS
- `node scripts/test-aggregate-version-contract-09613.mjs`: PASS
- `node scripts/test-cross-platform-ios-shell-09670.mjs`: PASS
- `node scripts/test-worker-auto-deploy-09693.mjs`: PASS
- `node --check worker/metar-proxy.js`: PASS
- `node --check worker.js`: PASS
- Bytevergleich `worker.js == worker/metar-proxy.js`: PASS
- Bytevergleich kanonische `worker-src/*`-Reihenfolge gegen `worker/metar-proxy.js`: PASS
- Semantischer Worker-Diff v0.9.77.18 → v0.9.77.19: `changed=true`
  - vorher: `58c685922fccf3f91f99d3157eeb6c8e40d73ccf5a902311cfe07680a70b20bc`
  - nachher: `8613585dcfac53b790b63d1bcae454efecfdc4a2fabe0550e9af922db696a96e`

## Einordnung des GitHub-Fehlers #828

Der reale Installerlauf #828 auf v0.9.77.18 hatte die reproduzierbare NPM-Installation, Dependency-Prüfung, TypeScript-Kompilierung und den Vite-Produktionsbuild bereits erfolgreich abgeschlossen. Von 631 Regressionen war anschließend genau `scripts/test-maintenance-modularization-09560.mjs` rot, weil sein Soll-Aggregat `worker-src/05-knmi-eps-cache.js` noch nicht enthielt. Diese Ursache ist in v0.9.77.19 direkt korrigiert; ein Rollback der KNMI-Arbeit erfolgt ausdrücklich nicht.

## Vollständiges Release-Gate

In der lokalen Containerkopie ist kein vollständiger NPM-Abhängigkeitsbaum vorhanden; mehrere `node_modules`-Verzeichnisse sind nur unvollständige/erzeugte Platzhalter und der externe Paketnetz-Zugriff steht in dieser Laufzeit nicht zuverlässig zur Verfügung. Deshalb wird ein lokales `npm run verify` hier nicht fälschlich als vollständig bestanden ausgewiesen.

Der autoritative Abschluss bleibt der reguläre GitHub-Installer nach Upload des neuen unversionierten `MID-professional-replacement.zip`. Dort werden erneut reproduzierbares `npm ci`, Dependency-Audit, TypeScript, Vite, sämtliche automatisch erkannten Regressionen, Capacitor-/iOS-Kopie, Worker-Semantik, Worker-Staging/Health, Pages und `mid-stable` ausgeführt. Der v0.9.77.19-Quellstand beseitigt genau den einzigen fachlich belegten Blocker von #828 und ergänzt dafür neue gezielte Regressionen.

## Worker

**Worker-Aktualisierung erforderlich: Ja.** Gegen v0.9.77.18 liegt eine fachliche Änderung vor. Der reguläre Installer soll den geprüften Worker über den bestehenden automatischen 0%-Smoke-/Promotion-/Rollback-Pfad veröffentlichen; ein separater manueller Worker-ZIP-Upload ist bei korrekt aktivierter Auto-Deploy-Konfiguration nicht erforderlich.
