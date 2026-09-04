# MID v0.9.78.35

## P0: 14-Tage-Ensemble bleibt dauerhaft im Ladezustand

Die intensive Prüfung des seit mehreren Releases beobachteten Dauerladens hat einen echten Anti-Hang-Fehler im Datenpfad ergeben. Der progressive Ensemble-Schnellstart aus v0.9.78.32 verwendete zwei parallele Bootstrap-Zweige über `Promise.any()`. Der Workerpfad war zwar zeitlich begrenzt, der anschließende direkte Open-Meteo-Ensembleabruf jedoch nicht. Blieb ein Browser-`fetch()` (insbesondere nach Worker-Fallback) auf iOS/Safari dauerhaft pending, konnte ein Bootstrap-Zweig nie auflösen oder verwerfen. Dadurch wartete `Promise.any()` unbegrenzt, `ensembles()` kehrte nie zur Voll-/Fallbacklogik zurück, `ensLoading` blieb `true`, und die Retry-Logik aus v0.9.78.33 wurde niemals erreicht. Ein App-Neustart startete lediglich denselben blockierbaren Pfad erneut.

## Korrektur

### 1. Harte Zeitgrenzen im Ensemble-Netzwerkpfad
- Direkter Open-Meteo-Ensembleabruf: 12 s je Versuch.
- Modellabruf: 26 s Gesamtbudget je Modell (34 s im Hintergrund).
- Worker-Ensembleproxy: 10 s im Vordergrund, 16 s sonst.
- Timeout eines Modells ist fail-open: Das nächste unabhängige Modell wird versucht; der globale Forecast-Controller wird nicht mit abgebrochen.

### 2. Bootstrap kann nicht mehr deadlocken
- Der gesamte Schnellstart besitzt ein 30-s-Zeitbudget.
- Das Bootstrap-Zeitbudget verwendet einen eigenen AbortController und lässt den übergeordneten App-Request intakt.
- Nach Ablauf fällt MID kontrolliert in den regulären Ensemblepfad zurück, statt dauerhaft `Promise.any()` abzuwarten.

### 3. Wirklich unabhängige Bootstrap-Familien
Der frühere Bootstrap konnte zwei erfolgreiche Varianten derselben Unabhängigkeitsgruppe als sein Ziel zählen und anschließend wegen fehlender zweiter Modellfamilie dennoch keine Tagesreihe erzeugen. Der Schnellstart nimmt jetzt pro `independenceGroup` nur einen Primärkandidaten und priorisiert bei Mittel/Spread ausdrücklich globale, unabhängige Familien:
1. ECMWF IFS ENS Mittel/Spread
2. NOAA GEFS Mittel/Spread
3. GEM GEPS Mittel/Spread
4. Google WeatherNext 2
5. BOM ACCESS

Der Member-Bootstrap folgt derselben Unabhängigkeitslogik.

### 4. App-Level-Watchdog
Zusätzlich schützt `App.tsx` den sichtbaren Zustand mit einem 65-s-Watchdog. Selbst wenn ein künftig unbekannter Unterpfad wider Erwarten nie settled, wird der blockierte Request aktiv abgebrochen, der Ladezustand beendet und der Timeout sichtbar gemeldet. Nach 20 s startet automatisch eine frische Ensemble-Refreshgeneration. Damit ist ein permanenter Spinner auch außerhalb der heute bekannten Ursachen ausgeschlossen.

### 5. Worker-/AIFS-Vertrag vervollständigt
Der Worker-Ensembleproxy ließ bislang `cloud_cover`, `cloud_cover_low`, `cloud_cover_mid` und `cloud_cover_high` nicht durch. Der AIFS-Europa-Audit verlangte diese Felder, sodass ein ansonsten erfolgreicher Workerproxy-Abruf unnötig in den direkten Browser-Fallback gezwungen wurde. Die vier Felder sind nun im Proxy freigegeben.

## Regression
Neu: `scripts/test-ensemble-deadline-watchdog-097835.mjs` schützt direkte Request-Deadline, Modellbudget, Bootstrap-Budget, unabhängige Bootstrap-Familien, den App-Watchdog sowie den AIFS-Cloud-Workervertrag.
