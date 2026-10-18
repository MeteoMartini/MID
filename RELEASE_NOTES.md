# MID v0.9.85.286

- Push-Einstellungen: schnelle Änderungen der relativen/absoluten Zeitanzeige werden in Reihenfolge übertragen; ältere Antworten überschreiben die aktuelle Auswahl nicht.
- Die Oberfläche unterscheidet lokales Speichern, ausstehende Übertragung und die Bestätigung der konkreten Auswahl durch den Server. Fehlendes Geräteabo und Speicherfehler werden ausdrücklich angezeigt.
- Laufende Push-Auswertungen prüfen die neueste lesbare Registrierung vor dem Versand und bewahren neuere Einstellungen bei Status-Rückschreibungen. Keine globale Atomaritätsgarantie für Cloudflare KV; keine Änderung amtlicher Warnungen oder meteorologischer Schwellen.
