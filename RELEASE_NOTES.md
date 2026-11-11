# MID v0.9.85.456

- Der DWD-Pollenflug weist unvollständige Angaben im 3-Tage-Ausblick auch dann aus, wenn andere Pollenarten gleichzeitig bekannte Belastungswerte zeigen. Fehlende Angaben werden nicht als Null dargestellt.
- Bestehende Funktionen bleiben erhalten. Zusätzliche Regressionstests schützen den Sonnenverlauf, die Pollenbeschriftung und das verzögerte Laden des optionalen Pollenmoduls.
- Die ausschließlich lesende Release-Train-Vorprüfung zeigt bei einer Ablehnung die Gründe an. Die Ablehnung bleibt verbindlich und kann keine Veröffentlichung auslösen.
- Die Versionshinweise unterscheiden den tatsächlich vorhandenen Review-Schutz von einer noch nicht freigegebenen Erweiterung. Die freiwillige Web-/PWA-Diagnostik nutzt nach Einwilligung eine kurzlebige Sitzungskennung statt einer dauerhaften Nutzerkennung.
- Die 15-Minuten-Prognose kann unabhängig belegte RUC-Gewittersignale berücksichtigen, auch wenn die native Niederschlagsmenge fehlt. Fehlende Regen- und Schneemengen bleiben unbekannt; dies ist keine amtliche Gewitterwarnung.
- Der Release-Self-Heal ergänzt einen eng begrenzten Wiederholungsversuch für einen belegten Browser-Zeitüberschreitungsfall. Die bestehenden sicheren Wiederholungen temporärer Transportfehler bleiben erhalten; deterministische Test- und Sicherheitsfehler sperren weiterhin.
- Der SHA-gebundene Release-Bot erhält eine zusätzliche Überprüfung offener GitHub-Reviewthreads unmittelbar vor dem Merge. Der Schutz gegen gleichzeitig neu eintreffende Threads beruht separat auf der GitHub-Branchregel; der neue Botcode wird erst nach erfolgreicher Veröffentlichung wirksam.
