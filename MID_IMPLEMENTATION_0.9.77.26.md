# MID Implementation v0.9.77.26

Datum: 2026-09-02

## Anlass

In v0.9.77.25 wurde der saisonale Langfristbereich vollständig ausgeblendet, sobald der Datenabruf nur eine numerisch verfügbare Saisonmodellfamilie zurückgab. `LongRangePanel` renderte die Saison-Rauchfahnen nur bei `models.length >= 2`; für genau eine Modellfamilie erschien ausschließlich ein Hinweistext. `LongRangeModelComparison` ist dagegen bewusst erst ab zwei Linien sinnvoll.

## Umsetzung

- `src/LongRangePanel.tsx` rendert den saisonalen Langfristtrend ab **einer** numerisch verfügbaren Modellfamilie.
- Bei genau einer Modellfamilie zeigt MID deren echte Temperatur- und Niederschlags-Rauchfahnen aus den gelieferten P10/P25/P75/P90- bzw. Modell-/Ensemblewerten.
- Der Kopf heißt in diesem Fall `Saisontrend · <Modellfamilie>` und kennzeichnet klar, dass bei weiteren verfügbaren Modellfamilien automatisch zum Poor-Man’s-Ensemble erweitert wird.
- Ab zwei Modellfamilien bleibt der v0.9.77.25-Vertrag unverändert: gleichgewichtetes Poor-Man’s-Ensemble mit einer Stimme je unabhängiger numerisch verfügbarer Modellfamilie plus gemeinsamer Einzelmodellvergleich.
- Der reine Kasten `Ein einzelnes Saisonmodell verfügbar` wurde entfernt; er ersetzt nicht länger die fachliche Darstellung.
- `LongRangeModelComparison` bleibt absichtlich erst ab zwei numerisch darstellbaren Modelllinien sichtbar, damit bei nur einer Quelle keine redundante zweite Grafik entsteht.
- Die Einleitung des Moduls beschreibt den Fallback jetzt korrekt: numerischer Saisontrend ab einer Quelle, Poor-Man’s-Ensemble automatisch ab zwei Quellen.

## Ursache und Abgrenzung

Der Fehler lag in der **Frontend-Gate-Logik**, nicht im Poor-Man’s-Ensemble selbst. Wenn z. B. NOAA/NMME/CFSv2 oder ein anderer saisonaler Datenpfad temporär nicht numerisch geliefert wird, muss MID die noch vorhandene ECMWF-/sonstige Saisoninformation weiter darstellen. Das Multi-Modell-Ensemble wird nur gebildet, wenn mindestens zwei unabhängige Modellfamilien tatsächlich verfügbar sind.

## Worker

Keine fachliche Workeränderung. Die bereits vorhandenen saisonalen Worker-Endpunkte und Modellquellen bleiben unverändert; Workerdateien wurden nur auf die Releaseversion synchronisiert.
