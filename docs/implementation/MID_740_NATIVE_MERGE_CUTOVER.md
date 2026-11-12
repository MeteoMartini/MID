# #740 · Native Durchsetzung von Review-Entscheidungen beim Merge

Basis v0.9.85.460, main = mid-stable e84d2d2418cc9f1c190fd95539fb8335960c9d93. Der vorhandene Reviewguard bleibt verbindlich. Der offene Fall ist eine merge-blockierende Review-Entscheidung, die erst nach seinem Readback eingeht und keinen Inline-Thread eröffnet.

## GitHub-Regel für den isolierten Abnahmetest

Ein eigenes Ruleset mit explizitem Testbranch verwenden. Vor Aktivierung für main muss der Release-Transport angepasst und verifiziert sein. Der Production Branch Guard #23963851 bleibt bestehen. Das zusätzliche Ruleset hat eine eigene, leere Bypass-Liste, auch für die Release-App.

```json
{
  "name": "MID Native Source Review Pilot",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": {
    "ref_name": { "include": ["refs/heads/codex/mid-native-review-pilot"], "exclude": [] }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["squash"]
      }
    }
  ]
}
```

Der Eigentümer kann das aus GitHub gelesene vollständige Regel-JSON mit `node tools/ci/mid-native-review-policy.mjs <ruleset-readback.json> refs/heads/codex/mid-native-review-pilot` prüfen. Wenn GitHub die Bypass-Liste aufgrund fehlender Rechte auslässt, ist die Prüfung negativ. Der Pilot braucht einen unabhängigen Reviewer mit der von GitHub für blockierende Reviews verlangten Berechtigung. Ein frei kommentierender KI-Bot ist dafür nicht ausreichend.

## Abnahme am Mergepunkt

1. Eine Test-PR mit neutralen Inhalten, exakt festgehaltenem HEAD und unabhängiger gültiger Zustimmung vorbereiten. Keine Testaktion auf main oder mid-stable. Dieselbe App-Identität und die gleiche SHA-gebundene Squash-API wie im Release verwenden.
2. Nach dem letzten positiven Readback eine separate berechtigte Review **Changes requested** ohne Inline-Thread abgeben. Merge muss serverseitig scheitern. Zusätzlich offenen Inline-Thread, veraltete Zustimmung nach neuem Commit und direkten Push mit derselben App ablehnen lassen.
3. Positiver Gegenversuch auf dem Testbranch erst nach dokumentierter Disposition, Aufhebung der Änderungsanforderung und gültiger Zustimmung. Erwartet ist der Merge des gebundenen HEAD. Antworten, Review- und PR-SHAs, Branch-Refs und Ruleset-ID sichern. Keine Tokens protokollieren.

## Produktionsumstellung

Heute schreibt agent-source-release.yml einen ZIP-Commit direkt auf main. install-mid.yml schreibt zusätzlich den Installationscommit direkt auf main und promotet danach mid-stable. Die oben beschriebene Require-PR-Regel für main würde beide direkten main-Updates blockieren. Dem Release-Bot im neuen Review-Ruleset einen Always-Bypass einzuräumen würde die atomare Review-Sperre aushebeln.

Der Leitchat braucht daher zuerst einen transportseitigen Integrationskandidaten: ZIP als unveränderliches, per SHA/Digest gebundenes GitHub-Artefakt aus dem Source-Merge, verifiziert durch den bestehenden Installer. Notwendige generierte Änderungen müssen einen geschützten PR-Pfad durchlaufen oder bereits Bestandteil des geprüften Source-Trees sein. Installer-Gates, Rollback, kontrollierte Stable-Promotion und main=mid-stable vor dem nächsten Release müssen im isolierten Pilot zusammen funktionieren. Danach kann der Eigentümer die zusätzliche native Regel ausschließlich für main aktivieren, mit leerer Bypass-Liste und einem unabhängigen Approval pro Review-Revision. Aktuelle Schutzregeln bleiben bestehen.

Die Datei und der Prüfer ändern keine GitHub-Einstellungen. #740 ist abgeschlossen, wenn die native Regel auf main nachgewiesen ist, der verspätete Negativfall am Mergepunkt reproduzierbar abgewiesen wird und ein vollständiger regulärer Release auf Stable gelingt.

GitHub-Dokumentation: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
