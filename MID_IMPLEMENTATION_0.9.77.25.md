# MID_IMPLEMENTATION_0.9.77.25.md

## Umfang

v0.9.77.25 konsolidiert drei Darstellungs-/Auswertungsverträge im gemeinsamen Browser/PWA/iOS-Fachkern. Es gibt keine neue Cloudflare-Ressource, keine Apple-Capability und keine fachliche Workeränderung.

### 1. Witterungstrend Tag 15–46

- `Temperatur` bleibt der Default, wenn kein gültiger gespeicherter Parameter vorhanden ist.
- Legacy-Tmin/Tmax-Werte werden weiterhin auf `Temperatur` normalisiert.
- Die zuletzt gewählte Metrik wird unter `mid:subseasonal-trend:metric` gerätelokal persistiert.
- Ungültige oder nicht lesbare Storage-Werte fallen fail-safe auf Temperatur zurück.

### 2. Langfristtrend / Season

- Das bisherige Multi-Modell-Saisonbild wird als **Poor-Man’s-Ensemble** ausgewiesen.
- Eingeschlossen werden alle tatsächlich numerisch geladenen unabhängigen Saisonmodellfamilien aus den vorhandenen MID-Quellen; jede Modellfamilie erhält genau eine Stimme, damit ein Modell mit vielen Membern das Familienensemble nicht allein dominiert.
- Reine Katalogeinträge ohne numerische Werte werden nicht als verfügbare Modelle ausgegeben und nicht künstlich in das Ensemble aufgenommen.
- Alle tatsächlich numerisch verfügbaren Einzelmodelle werden zusätzlich gemeinsam in **einem** Diagramm dargestellt. Temperatur und Niederschlag sind dort umschaltbar; Linienidentitäten verwenden ein eigenes Theme-taugliches Modellfarbsystem und verändern den appweiten Parameter-Farbvertrag nicht.
- Die gemeinsamen Einzelmodellgrafiken skalieren auf mobile Hoch-/Querformate ohne erzwungenen horizontalen Scrollcontainer.
- Nicht-numerische Status-/Katalogkästen, der redundante Einzelmodell-Kartenstreifen und der externe C3S-Vergleichskasten sind aus der Hauptansicht entfernt.
- Eine tatsächlich numerisch verfügbare DWD-GCFS2.2/EPISODES-Perspektive bleibt als reale Datenperspektive zulässig; Platzhalter-/Pending-Kästen werden nicht gezeigt.

### 3. Tmin/Tmax in 7-/14-Tage-Übersichten

- Tmin wird wieder in einem kleinen bläulichen, Tmax in einem kleinen rötlichen Kästchen dargestellt.
- Zahl, Hintergrund und Rahmen bleiben strikt innerhalb der jeweiligen Tmin-/Tmax-Farbfamilie.
- Die Klimaabweichung verwendet eine nichtlineare Wurzelkennlinie; dadurch reagieren bereits Abweichungen um etwa ±0,5 bis ±1 K sichtbar, während sehr große Abweichungen sanft sättigen.
- Aktuelle und stündliche Einzeltemperaturen bleiben neutral und erhalten keine Tmin-/Tmax-Kästchen.

## Architektur-/Kostenfolge

- gemeinsamer React/Vite-Fachkern für Browser, PWA und Capacitor-iOS
- keine iOS-Abspaltung
- keine neue Datenquelle, kein neues Binding, keine Queue, kein Paid-Plan
- Worker nur auf v0.9.77.25 versionssynchronisiert; **kein funktionaler Worker-Upload erforderlich**
- formales iOS-`nextMilestone` bleibt `macos-xcode-simulator-quality-assurance`
