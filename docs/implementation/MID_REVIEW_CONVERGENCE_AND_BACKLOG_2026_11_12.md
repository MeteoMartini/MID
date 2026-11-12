# MID Release Konzept 1.3 – Review-Konvergenz ohne Endlosschleife

**QA-Draft; noch keine Produktivfreigabe.** Ausgangspunkt: erfolgreich veröffentlichte
v0.9.85.456, `main=mid-stable=78409f80bfea5112700ff4a119b7c8bd46090c22`;
Installer #43164968254 erfolgreich. Die aktuellen, versionierten AGENTS-/Release-Verträge
bleiben unverändert. Keine neuen Rulesets, Required-Checks, Apprechte, Secrets, Deployments
oder dauerhaften Cloud-Dienste. Quelländerungen nur auf chatgpt/*-Branch.

## Verbindliche Entscheidungslogik (Vorbereitung und Triage, niemals Freigabe)

1. **Draft:** offene neue Befunde als konkrete SHA-/Pfad-/Regel-/Fundstelle einsammeln
   und deduplizieren. Identischer Report auf demselben SHA zählt einmal.
   Unterschiedliche Schweregrade/Dispositionen desselben Fingerprints sind ein
   **Konflikt**, keine automatisch bereinigte Doppelmeldung.
2. **Bis zu zwei automatische Nachbesserungsrunden** ausschließlich im Draft.
   In einer Runde konkrete P0/P1/fachkritische P2-Funde gesammelt korrigieren,
   negative Regressionen ausführen, exakte Herkunft dokumentieren. Ein weiterer
   automatisch gestarteter Loop ist ab Runde 2 **untersagt**.
3. **Ab Runde 2 / nach Freeze:** keine weiteren eigenmächtigen Bot-Codeänderungen.
   Entscheidung durch den Leitchat: (a) tatsächlichen Defekt vollständig beheben
   und einen **neu qualifizierten** Kandidaten eröffnen, (b) den betroffenen Scope
   nach gesichertem SHA-Vergleich herausnehmen und den verbleibenden Kandidaten
   vollständig neu prüfen, oder (c) mit konkret benanntem Grund blockiert halten.
   P0/P1 und fachkritische P2 niemals als bloßen Backlog deklarieren. Die
   Rundengrenze beendet **nur die automatischen Schleifen**, nie die Sicherheitsgates.
4. **Freeze vor Ready:** einen einzigen HEAD/Version/Umfang festlegen. Bei jeder
   HEAD-Änderung danach wird der volle Source-Gate-Nachweis ungültig; kein Test-Skip.
   Ein grünes KI-Review ersetzt nie den GitHub-Reviewzustand.
5. **Source grün → Bot → ZIP → Installer → Worker/Pages → Stable** bleibt der einzige
   Veröffentlichungsweg. Native GitHub-Conversation/Review, Rulesets, Versions-,
   Meteorologie-, Browser-/Geräte- und Security-Gates gelten weiterhin.
6. **P2/P3:** Offene, unkritische P3 dürfen lediglich als **unverbindliche Backlog-Kandidaten** markiert werden. Eine endgültige Disposition erfordert dokumentierte fachliche Risikoentscheidung und außerhalb dieses Planers unabhängig validierte Evidenz; auch P2-Risikoakzeptanz muss explizit boolesch `true` und unabhängig belegt sein. Eine noch offene native Reviewkonversation bleibt trotzdem ein GitHub-Mergeblocker und muss auf sachlicher Grundlage abgeschlossen werden.

## Implementierung

- `tools/ci/mid-review-convergence.mjs`: pure, deterministische Statusmaschine,
  SHA-/Freeze-/Review-**Eingabeplausibilität** (keine GitHub-Authentisierung), beratende Obergrenze von zwei automatischen Fixrunden,
  Doppelmeldungen und Konflikte, evidenzgebundene Disposition, echte kritische
  Blocker, P2-Risikotriage. Gibt **immer** `releaseAuthorized:false`,
  `mergeAuthorized:false`, `sourceGateAuthorized:false`,
  `autoCloseThreads:false` zurück.
- `tools/ci/mid-pr-backlog.mjs`: lesende PR-Planung aus gelieferten GitHub-
  Metadaten und verifizierten Dateipfaden; Baseline-Drift, überlappende Pfade,
  erste Gruppen, max. fünf **potenzielle** PRs gemäß vorhandenem Release-Train-
  Vertrag. Geteilte Dateinamen sind keine Beweise einer früheren Übernahme.
  Keine PRs automatisch schließen, kein Merge, keine Regeln ändern.
- `tests/unit/mid-review-convergence.test.ts`: deterministische Negativfälle
  für übergebene **simulierte** P0/P1/P2- und GitHub-Zustandsangaben,
  widersprüchliche Doppelmeldungen, SHA-/Rundengrenzen und abgelehnte
  P2-Strings als Risikoakzeptanz. Die Tests lesen keine echten GitHub-Reviews
  und authentisieren weder `independentVerified` noch beliebige JSON-Claims.
- Der Status basiert ausschließlich auf vom Aufrufer gelieferten Eingaben und
  ist **nicht** selbst unabhängig verifizierte GitHub- oder Reviewer-Evidenz.
  Echte native Review-/Conversation- und Source-Gates müssen extern aus GitHub
  SHA-genau gelesen und unabhängig bestätigt werden. Weder eigenmächtige
  Auto-PR-Änderungen noch automatische Stable-Promotion.

## Erste Backlog-Reihenfolge auf .456-Basis

**Keine automatische Merge- oder Schließentscheidung:** Zunächst #759 und #760
(Sicherheit/Diagnostik), danach #750 (RUC und Originaldaten), #755/#757
(Karten). #749/#753/#756/#758 wurden teilweise oder vollständig in #754
selektiv übernommen; ihre Diff-/Blob-SHAs auf dem neuen Stable vergleichen,
bevor als redundant geschlossen wird. Ältere Drafts mit .454/.453-Basis
nicht rebasen oder überschreiben, sondern source-spezifisch prüfen.
#728 (AI Router) bleibt eigenständiger, nicht automatisch autorisierter
Anwendungs-/Rechteumfang. #720/Dependabot nur nach eigenen Security- und
Regressionstests. Die tatsächliche Reihenfolge kann sich durch kritische neue
Befunde ändern.

**Das hier ist keine neue verpflichtende Reviewer-App, keine zusätzliche
einzuführende GitHub-Review-Regel und keine Freigabe bei fehlender Evidenz.**
Eine Automations-Rundengrenze ist eine verlässliche terminierende Entscheidung,
nicht eine Abschwächung des bereits wirksamen Review-/Release-Schutzes.
