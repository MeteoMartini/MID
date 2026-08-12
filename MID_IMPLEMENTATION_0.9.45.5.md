# MID v0.9.45.5

## CI-/Regression-Hotfix

- Behebt ausschließlich den fehlgeschlagenen Installer-/Regressionstest aus v0.9.45.4.
- `scripts/test-feature-suite-0797.mjs` verlangte historisch noch den Quellcode-Token `locate(false)`, obwohl die Standortlogik inzwischen bewusst weiterentwickelt wurde.
- Dieser veraltete Token-Zwang wurde entfernt; alle übrigen Schutzbedingungen der alten Funktionssuite bleiben unverändert.
- Die aktuelle Standortfunktion `locate(openLocation=true)` sowie die Persistenz des letzten/manuellen Orts bleiben unverändert.
- Neuere dedizierte Standort-/Favoriten-Regressionen bleiben maßgeblich für das Verhalten beim App-Start und bei aktueller GPS-Ortung.

## Funktionale Änderungen

Keine. Wetterlogik, Events/Aktivitäten, Planer, Navigation und UI entsprechen unverändert v0.9.45.4.

## Worker

Kein fachlicher Worker-Code geändert. Die Versionskennung wird releaseweit auf v0.9.45.5 synchronisiert; ein Worker-Deployment ist nicht erforderlich.
