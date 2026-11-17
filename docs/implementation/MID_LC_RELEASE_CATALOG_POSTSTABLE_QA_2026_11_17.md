# MID LC · Versionskatalog nach Stable-Promotion – isolierte QA (17.11.2026)

Status: DRAFT / NICHT EINGEHÄNGT / KEIN GITHUB RELEASE ERZEUGT.

Authentische Basis: main = mid-stable = 9fe4dfbcdfd5a1f8fec55efa868e22110a612953 / v0.9.85.488, fünf aktive Rulesets.
Das vollständige Source-Gate zu PR #902 bleibt wegen Issue #903 (HIGH picomatch) zwingend blockiert.

Das neue Skript tools/release/publish-verified-release-catalog.mjs ist nur für einen künftig autorisierten, nach
finalize_release erfolgreichen Installer-Job aus dem regulären install-mid.yml vorbereitet. Seine reine
Entscheidungsfunktion prüft exakt die sechs Versionsspiegel, Original-Run/Attempt, Source-SHA, aktuelle
Version-Notes, alle 4 Core- und 6 Heavy-Shards, Release-Original, Worker, Pages und finalen Stable-Job.
Bestehende fremde GitHub-Tags/Releases werden niemals verschoben oder überschrieben; Wiederholung nur idempotent.
Es werden keine ZIPs/Dist/Attestierungen erzeugt, keine Recovery-Freigabe erteilt und keine alten Versionen
ohne historischen SHA-/Installer-Nachweis nachgetragen. Der Spezialchat #839/#740 bleibt Owner von Immutable
Recovery, dauerhaften Original-Artefakten und dem abschließenden Sicherheits-/Review-Cutover.

Es wurde bewusst KEINE Workflowdatei verändert: offener Dependabot-PR #837 bearbeitet
.github/workflows/install-mid.yml. Wegen Parallel-Overlap und fehlender Source-Security-Gates darf
der bestehende Installer nicht konkurrierend umgeschrieben werden. Für den späteren sicheren Handoff
müssen .github/workflows/install-mid.yml und ci/github/workflows/install-mid.yml byteidentisch
im selben geprüften Integrationstrain geändert werden. Ein neuer unabhängiger Releasebot ist verboten.

GitHub API Referenz: https://docs.github.com/en/rest/releases/releases
Immutable Assets: https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases
