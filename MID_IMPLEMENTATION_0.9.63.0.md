# MID v0.9.63.0 – Wartungs- und Qualitätsrelease

## Struktur

- Flugmeteorologische Auswertung, Komposit-Einstellungen, Speicherklassifikation und Prognosequellendiagnose wurden aus den großen UI-Komponenten herausgelöst.
- `storageContracts.ts` ist die gemeinsame Autorität für dauerhafte, transiente und sicherungsfähige Schlüssel. Persistenz und Speicherbereinigung verwenden dieselben Klassifizierer.
- JSON-Caches verwenden gemeinsame Lese-/Schreibhelfer aus `cachePolicy.ts`; der Forecast-Fusion-Cache wurde wegen des erweiterten Antwortvertrags auf v9 angehoben.
- Komposit-Layer behalten ihren bestehenden v3-Schlüsselvertrag. Aktivierung, Kartenstil, Transparenzen und Zeit-/Bewegungsmodus überleben Neustarts unverändert.

## Nutzerverträge

Neue Regressionen prüfen die sichtbaren Verträge statt interner Komponentenformen: eine kanonische Prognosekette, unabhängige Modellbudgets, textuelles vertikales Flugbriefing, dauerhafte Komposit-Einstellungen, gemeinsame Speicherklassifikation und das Worker-KV-Budget.

Der Komposit-Zeitpfeil-Vertrag aus v0.9.60.15 bleibt unverändert: wolkengewichtete Schwerpunktströmung, dynamische Zoom-/Geschwindigkeitsskala, Zeitangaben an den Unterteilungen, Pfeilspitze exakt am ausgewählten Ort und strikte Trennung vom Geräteort-/Sichtrichtungspfeil.

## Worker-Hinweis

Da dieser Sammelstand die serverseitige Fusionsgewichtung und den Push-KV-Scheduler ändert, ist `MID-worker.zip` zwingend zusammen mit der Professional-App auszurollen.
