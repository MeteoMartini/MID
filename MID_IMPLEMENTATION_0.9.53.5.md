# MID v0.9.53.5

## Events & Aktivitäten – Reload bis zum sichtbaren Event-Stand durchgezogen
- Der appweite Reload in der Kopfzeile aktualisiert jetzt nicht nur den aktuell geöffneten Wetterstand, sondern stößt bei vorhandenen Events gleichzeitig eine echte Event-Center-Neuberechnung an.
- Der unsichtbare Event-Aktualisierer wird bereits bei vorhandenem Standort und gespeicherten Events bereitgestellt und hängt nicht mehr davon ab, dass der aktuelle Forecast-Snapshot schon vollständig geladen wurde. Dadurch geht ein Reload während Start/Neuladen nicht verloren.
- Langsame optionale Zusatzquellen (Modellmetadaten, Forecast-Fusion, Event-Ensemble) können die Event-Neuberechnung nicht mehr unbegrenzt blockieren. Der Kernpfad bleibt die frische Stundenprognose; optionale Quellen erhalten begrenzte Zeitfenster und fallen bei Zeitüberschreitung sauber zurück.
- Nach erfolgreicher Neuberechnung werden LocalStorage, interner Event-Ref und sichtbarer React-State unmittelbar gemeinsam aktualisiert. Der in „Details & Rat“ angezeigte `Stand` folgt damit direkt dem neuen `refreshedAt`.
- Die bisherige Änderungs-/Glockenlogik bleibt unverändert: Nur meteorologisch relevante Änderungen werden hervorgehoben; der neue Aktualisierungszeitpunkt allein erzeugt keine Warnung.

Worker: keine funktionale Änderung gegenüber v0.9.53.4; nur Versionssynchronisation. Ein erneuter Cloudflare-Worker-Upload ist für diesen Fix nicht erforderlich.
