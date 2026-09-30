# MID v0.9.85.128 – Screenshot-/Security-Nachgang und Gesundheitswetter

## Verifizierte Basis
- Repository: `MeteoMartini/MID`
- Ausgangspunkt: `mid-stable == main == 479d6d55322dc33f03aad868e35f2d6ee0f9197f`
- Vorversion: v0.9.85.127
- Integrationsbranch: `chatgpt/v0.9.85.128-security-pollen`

## GitHub-Befunde
Die automatische Revision hatte bei grünem Build und 885 bestandenen Regressionen einen High-Severity-Dependency-Befund sowie einen erneuten externen Open-Meteo-Abruffehler gemeldet. Der High-Befund wird durch das kompatible transitive `brace-expansion`-Patch 5.0.12 geschlossen. Der moderate `uuid@7.0.3`-Befund liegt im Dev-/iOS-Toolingpfad über `xcode`; ein inkompatibles `npm audit fix --force` ist ausdrücklich nicht Teil dieses Builds.

Die sichtbaren CodeQL-Befunde werden an der Ursache gehärtet: externe Warnwahrscheinlichkeiten werden nur numerisch bzw. über eine begrenzte qualitative Allowlist dargestellt; der Bergwetter-Browsertest interpoliert keine dynamischen Selektoren/Theme-Werte mehr in ausführbaren Seitencode und verwendet keinen aus einer Datei gelesenen Port als Netzwerkziel.

Der alte Dependabot-PR für `actions/download-artifact` wird nicht übernommen, weil seine Basis zusätzliche veraltete Diffs enthält. Nur der aktuelle v8.0.1-SHA-Pin wird in den kanonischen und aktiven RUC-Workflow portiert. Der gruppierte Paket-PR wird wegen der bestehenden getrennten React-/MapLibre-/Vite-/Capacitor-Kompatibilitätsverträge nicht übernommen.

## Gesundheitswetter / Pollenflug
Replit wurde nach Sicherung des älteren lokalen Stands auf den verifizierten Stable synchronisiert und hat den Ist-Zustand read-only geprüft. Die Designempfehlung: Pollen als eigene Gesundheitswetter-Gruppe führen, in der kompakten Ansicht nur belastende Arten priorisieren, bei `keine` ruhig zusammenfassen, Drei-Tage-Details als 44-px-Disclosure ausführen und DWD-Quelle/Aktualität lesbar halten.

Die Integration setzt genau diese Punkte um. Persistenz, Standardzustand, DWD-Datenabruf, Pollenarten, Belastungslogik und Drei-Tage-Daten bleiben unverändert. Auf schmalen Displays bleibt das Detailraster horizontal nutzbar, statt Beschriftungen auf Mikrotypografie zu reduzieren.

## Prüfung / Release-Gate
Fokussierte Regression: `scripts/test-security-pollen-maintenance-0985128.mjs`.

Zusätzlich müssen im normalen Source-PR-Gate mindestens `npm ci`, Dependency-Audit, Typecheck/Produktionsbuild, vollständige Regressionen, Workflow-Synchronität, Web/iOS-Shell sowie CodeQL bestehen. Danach gilt ausschließlich der etablierte Source-PR → kontrollierter Merge → serverseitiges Release-ZIP → Installer → Pages/Worker-Prüfung → Stable-Promotion-Pfad.


## Source-Gate-Nachgang

Der erste Source-PR-Lauf zeigte fünf absichtlich fail-closed greifende Regressionen. Vier waren veraltete Spiegel-/Versionsannahmen: die Vertragsregistry stand noch auf .127, die Repository-Hygiene war unnötig exakt auf .127 festgenagelt, der RUC-Fachtest erwartete den alten download-artifact-v4-Pin und der kanonische RUC-Workflow lag hinter dem aktiven, bereits release-race-gehärteten Workflow zurück. Der neuere aktive RUC-Schutz wird deshalb in die kanonische Quelle übernommen; die Tests werden auf den strengeren Vertrag aktualisiert und nicht abgeschwächt.

Das CSS-Budget wird nicht angehoben. Stattdessen entfallen nicht mehr verwendete Pollen-Legacyregeln; die belastungsfreie Darstellung nutzt vorhandene Chip-Primitiven.
