# MID v0.9.58.4 – Favoriten-Reihenfolge dauerhaft

Die Nutzerreihenfolge der Ortsfavoriten ist jetzt ein eigener persistenter und geräteübergreifend konfliktfester Zustand. `mid:favorites:order:v1` speichert IDs und Revisionszeit; Startmigration, Shadow-Recovery und Sync respektieren diesen Stand.
