# MID Release Konzept 1.9 · SHA-verifizierter GitHub Release-Katalog — Post-Stable-QA

**Status:** Nur QA-Draft. Weder Installer-Workflow noch Bot-Rechte noch GitHub-Tags/Releases geändert. GitHub `releases/latest` zeigt noch `v0.9.85.119` trotz erfolgreicher Stable-Promotion v0.9.85.497. Dies ist eine echte Nutzer-/Release-Transparenzlücke, keine fehlende Wetterdatenveröffentlichung.

**Verifizierte Baseline:** `main=mid-stable=9fd872a789f4b158bc691d085589616c2c04f776`, `v0.9.85.497`, fünf Rulesets aktiv.

**Provenienz:** selektiver Code-/Test-Port aus historischem, ausschließlich QA-Commit `2972377e040f4d1f51d0170987dfb9ac394887e5`: ursprüngliche Blob-SHAs `bd0e69bb06429040a6a39b15bc84a952ed33d2d4`, `4674fcb3b97b0f286d50a51c9be4b87b98891ccf`, `23b30114e96244197e6f4b987a6b0fd501677f56`. Keine Übernahme des alten vollständigen PR-Baums. Originaltest wurde um ZIP-only-/Installer-/Stable-Lineage-Negativfälle und die Pflicht zur Pages-Artefaktvorbereitung erweitert.

**Sicherheitsvertrag:** Der Release-Catalog-Publisher prüft sechs Versionsspiegel, versionierte Release Notes, das originale `workflow_dispatch`-/Run-Attempt-Ereignis, Core 4/4, alle sechs Heavy-Jobs, Worker, Pages-Artefakt, mindestens einen echten erfolgreichen Pages-Deploy und finalen Stable-Job. Zusätzlich bindet er **Installer-Run HEAD -> exakt ein ZIP-only-Commit -> exakt dessen Stable-Fast-Forward-Nachfolger**, kontrolliert durch GitHub Commit-Eltern und vollständigen Compare-Diff (nur `MID-professional-replacement.zip`, added). Abweichungen blockieren.

**Safe execution (NICHT aktiviert):** Bestehendes `install-mid.yml` bleibt der einzige Release-/Deploypfad. Nach erfolgreichem `finalize_release` wäre ein direkt abhängiger, nachgelagerter Metadaten-Job im **gleichen** Installer-Workflow erforderlich, der `workflow_dispatch` / `in_progress` bei vollständig erfolgreichem Finalizer sieht und den **aktuellen echten Stable-SHA** read-only auscheckt. Nur dieser eng begrenzte Job dürfte einen bereits autorisierten GitHub-App-Token mit minimalem `contents:write` erhalten. Kein Repository- oder Branch-Admin-Bypass. Die beiden Installer-Workflowspiegel, sicherheitsrelevante Vertragstests und alle Release-Notizen müssen erst im nächsten kontrollierten Leitchat-Train unabhängig abgenommen werden.

**Keine Rückdatierung:** Veröffentlichung nur für neu abgeschlossene reale Releases nach tatsächlicher Stable-Promotion; keine historischen Tags, gefälschten Assets, ZIP-Recovery-Autorität oder Immutable-Signaturbehauptungen. Bestehender fremder Tag/Release => fail-closed; identischer gültiger Eintrag => idempotent. `make_latest` erst nach Original-SHA-/Job-/Notes-Nachweisen. Aktive RUC #541 und QA #947 bleiben unabhängig.

**Restchecks:** Wiederholung der Unit-/Security-Negativtests auf aktuellem Commit; unabhängige Shell/YAML-/Token-Provenienz- und Job-Abhängigkeitsprüfung, exakter GitHub-Review, vollständiges Source-/Core-/Heavy-/Installer-/Pages-/Stable-Gate. Erst produktives neues GitHub Release mit verifiziertem `/releases/latest` ist Erfolg, dieser QA-Draft nicht. Die tatsächliche GitHub-Rolle für den Katalog-Publisher ist vor Integration nach Least Privilege freizugeben.

## Sicherheitsnachschärfung: Tag-Races, Idempotenz und Latest-Readback

- Existiert bereits ein Tag ohne exakt identischen, autorisierten Katalogeintrag, wird keine Veröffentlichung daran angehängt; der Zustand bleibt BLOCKED. Direkt vor dem einzelnen GitHub-POST werden Tag und Release nochmals auf eine zwischenzeitliche Kollision gelesen.
- Ein bereits bestehender Katalogeintrag ist nur dann idempotent, wenn ID/Tag/Name/Status, null Assets sowie der gesamte normalisierte Original-Release-Body (Stable-SHA, aktueller vollständiger Installer-Run-Link, Changelog, Hinweise ohne Recovery-Rechte) exakt übereinstimmen. Ein im freien Markdown zufällig enthaltener SHA genügt nicht.
- Erfolgreiches Pages muss eindeutig sein: genau ein erfolgreicher Pages-Versuch; weitere Versuche dürfen ausschließlich übersprungen sein. Damit werden widersprüchliche Deploy-Belege abgewiesen.
- Nach dem schreibenden POST wird zusätzlich `/releases/latest` gegen die neue Release-ID und das exakte Tag verglichen; eine unerwartete andere `latest`-Antwort wird als Abnahmefehler gemeldet. Die Prüfung bleibt im QA-Draft inaktiv, bis der Leitchat die vollständige Installer-/Source-/Review-/GitHub-App-Berechtigungskette geprüft hat.
- Amtliche Wetter-, RUC-, Karten-, Worker- und Pages-Inhalte sowie vorhandene Deployment-/Rollback-Gates bleiben vollständig unverändert.

## MID Release Konzept 1.10 · Idempotenz ohne falschen Latest-Erfolg (20.11.2026)

- Ein bereits vorhandener, exakt zum aktuellen Stable passender GitHub-Release-Katalogeintrag darf **nur dann** als erfolgreich idempotent gelten, wenn auch `GET /releases/latest` dieselbe Release-ID und denselben Tag zurückliefert. Sonst **fail-closed**, kein erneuter POST, kein Überschreiben oder automatisches `make_latest`.
- Vor diesem Erfolg werden `main` und `mid-stable` auf dieselbe echte Release-SHA zurückgelesen; der unveränderte Katalog-Body und der auf den Commit zeigende Tag bleiben Pflicht.
- Der reine Entscheidungs-/Readback-Helper ist mit erfolgreichen und negativen Latest-/Tag-/SHA-Fällen testbar, ohne einen echten Release zu erzeugen.
- QA-Änderung nur in diesem bestehenden Draft; keine Installer-Verdrahtung, keine Produktionsfreigabe. Der Leit-Chat benötigt nach erfolgreichem `finalize_release` weiterhin einen gesondert geprüften minimal berechtigten Katalog-Aufruf, volle Source/Core/Heavy/Review/Installer/Worker/Pages/Stable-Gates und echtes Release-/Latest-Readback.
