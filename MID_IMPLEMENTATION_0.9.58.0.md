# MID v0.9.58.0 – nachhaltige GitHub-Pages-/Codeload-Resilienz

Der Release-Build ist von den GitHub-Pages-Actions entkoppelt. `actions/configure-pages` wird nicht mehr verwendet. Der geprüfte Build wird zuerst nach `main` committed; erst anschließend startet der Pages-Pfad.

Für Pages existieren drei voneinander getrennte Runner-Versuche mit eindeutigen Artifact-Namen. Versuch 1 und 2 sind recoverable; nach Fehlern folgen 75 s bzw. 180 s Backoff. Versuch 3 bleibt ein harter Fehler. Dadurch kann insbesondere ein HTTP-429 beim Vorladen von Actions im Job-Setup durch einen frischen Runner nach Abkühlzeit selbstständig überwunden werden.

`mid-stable` wird ausschließlich nach einem tatsächlich erfolgreichen Pages-Versuch aktualisiert. Die Stable-SHA-Prüfung bleibt hart. Der nachgelagerte Qualitätsstatus verwendet die GitHub-REST-API mit Retry für 429/5xx/Transportfehler.

Der manuelle Stable-Deploy verwendet denselben dreistufigen Pages-Retry-Vertrag.
