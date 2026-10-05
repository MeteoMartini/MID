# MID v0.9.85.168

- Veröffentlichungen werden schneller, ohne Prüfungen auszulassen: sicher als read-only erkannte Regressionen können parallel laufen, risikobehaftete Prüfungen bleiben seriell.
- Unnötige vollständige Git-Historien werden im normalen Releasepfad vermieden; bei einem parallelen main-Update wird weiterhin automatisch auf die vollständige Race-Prüfung eskaliert.
- Das Pages-Paket wird bereits während der Worker-Prüfung vorbereitet, aber weiterhin erst nach erfolgreichem Worker-Gate veröffentlicht.
- Die Stable-Freigabe bleibt ein verifizierter Fast-Forward ohne Force-Update und prüft den finalen SHA weiterhin ausdrücklich.
