# MID v0.9.85.130

## Einstellungen
- Unter „Inhalte & Navigation“ ist **Gesundheitswetter** jetzt als eigener, sichtbar getrennter Bereich angeordnet.
- **Pollenflug** kann dort direkt ein- oder ausgeschaltet werden. Der Zustand bleibt gerätelokal gespeichert.
- Der bisherige, durch die Navigations-Split-Ansicht verdeckte Pollen-Schalter ist entfernt; es gibt nur noch einen eindeutigen Einstellort.

## Navigation
- MID öffnet beim nächsten App-Aufruf wieder den zuletzt verwendeten Hauptbereich wie „Aktuell“, „Heute“, „Vorhersage“ oder „Karten“.
- Neben dem exakten letzten Modul wird die primäre Bottom-Bar-Auswahl gerätelokal gespeichert. Beim Wechsel in den Hintergrund bzw. beim Schließen wird die sichtbare Auswahl nochmals gesichert.
- Bei alten oder fehlenden Navigationswerten fällt MID kontrolliert auf „Aktuell“ zurück.

## Unverändert
- DWD-Pollenquelle, Pollenstufen, Wetterdaten, Warnlogik und Prognoseberechnung bleiben unverändert.
- Es handelt sich um eine UI-/Persistenzkorrektur; eine reine Worker-Versionsspiegelung löst keinen fachlichen Worker-Deploy aus.
