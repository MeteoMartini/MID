# MID #740 · Reale Binär-Artefaktprüfung des Installers v0.9.85.485 (16.11.2026)

**Scope: READ-ONLY QA / kein Cutover / keine Releaseberechtigung.** Am GitHub-Live-Stand `main=mid-stable=ccd1c0f60d67925aa01dd8d946b490fde4142709` wurde die reguläre `.485`-Installation nach vollständigem Installer-Run `43866924798` (`completed/success`, Versuch 1, Source-Event-SHA `f6651d44346a7ae37fedfab19008f385730b7b87`) geprüft. Das ändert weder `.github`-Workflows noch Rulesets, Branchschutz, Worker, Pages, Secrets oder `main`/`mid-stable`.

## Echte GitHub-Metadaten und Prüfergebnis

- Verifiziertes GitHub-Repository `MeteoMartini/MID`, Repository-ID `1305110795`, Installer-Workflow-ID `315863138`, Pfad `.github/workflows/install-mid.yml`, Trigger `workflow_dispatch`, `run_attempt=1`.
- Echten Actions-ZIP-Download von **Artefakt-ID `14226082167`** aus Run `43866924798` als `mid-source-43866924798-1` (25.533.984 Byte) per verbundenem GitHub-Zugriff bezogen.
- Außendigest der Original-Bytes: `sha256:49429356f236e007592737e733301cc19e259c4284a60573b6b1ba57493f79ce`, unabhängig lokal über sämtliche Bytes nachgerechnet. Archiv-Inhalt: genau `manifest.json` und `release.tar.gz`.
- Innere TAR-GZ-Bytes: 25.344.672, unabhängiger Digest `6dd349249a46d447072cc528de2b7ecde3bd818a8445cd0aecdbc560ff79a03f`, identisch zum Manifest.
- **3.814 Dateien**, 104 Verzeichnisse und 48.045.334 entpackte Datei-Bytes geprüft (nur streamend gelesen, **niemals extrahiert**). Jede Datei SHA256-gleich dem Manifest; keine Symlinks/Hardlinks/Devices, Traversalpfade oder Setuid-/Setgid-Modes im Archiv festgestellt.
- Acht unabhängig über GitHub-Blob-Readback erhobene SHA-1-Git-Objekte stimmen bytegenau mit den Originaldateien aus dem TAR überein: `AGENTS.md`, `package.json`, `MID_SOURCE_OF_TRUTH.md`, `MID_BASELINE.json`, `contracts/index.json`, `.github/workflows/agent-source-release.yml`, `.github/workflows/install-mid.yml`, `.github/workflows/deploy.yml`.
- Eigenständige Offline-Regressionen (synthetische kleine Archive) **11/11 erfolgreich**: Original-Positivtest sowie Ablehnung von Digest-Verfälschung außen/innen, falschem Event-SHA, manipulierten Datei-Hashes, Path-Traversal, doppelten JSON-Schlüsseln, unerwarteter TAR-Datei, Symlink, falschem und fehlendem Git-Blob.

## Fachliche Grenze

Dieser **reale Installer-Artefakt-Shadow** verifiziert lokale Downloadbytes und manifest-interne Integrität. Er authentifiziert *nicht* den zukünftigen `agent-source-release.yml`-**Producer**, enthält **keinen** originalen `mid-release-<SHA>`-Producer-Upload und beweist **keine vollständige Git-Tree-Parität aller 3.814 Dateien** (nur acht unabhängige Git-Blobs). Der Source-Bot-Run `43866850451` hatte **0** Actions-Artefakte. Eine Manifest-Prüfsumme allein ist weder Signatur noch Attestierung. Die echten kurzen Installer-Artefakte laufen am 17.11.2026 ab; sie sind **keine** dauerhafte `dist`-Recovery-Quelle.

Der neue Python-Prüfer `tools/ci/mid_740_installer_archive_shadow.py` akzeptiert nur eine außerhalb des Archivs beschaffte, exakt vorgegebene Envelope-SHA256 und Event-SHA. Optional verifiziert er externe unveränderliche Git-Blob-SHAs. ZIP/TAR werden nie entpackt oder ausgeführt; Größen, Pfade, Modi, Member-Typen und Duplikate werden geblockt. Er liefert immer `producerVerified:false`, `nativeReviewVerified:false`, `fullGitTreeVerified:false`, `installerAuthorized:false`, `recoveryAuthorized:false`, `releaseAuthorized:false`, auch bei vollständigem lokalen Erfolg.

**Nächster zwingender P0:** Nichtproduktiver, **authentischer Source-Producer-Upload** des exakten Source-Merge-SHA als eindeutig benanntes GitHub-Artefakt einschließlich Run-ID, Attempt, Workflow- und Repositoryidentität; anschließend echte byte-/mode-genaue Git-Tree-Gesamtprüfung im separaten Installer und dauerhaftes immutable `dist`-Recovery inkl. negativer Race-/Rerun-/Tag-/Rollback-Gates. Erst nach beiden transportierten Push-Pfaden, E2E- und unabhängiger Review-Governance darf eine native No-Bypass-PR-Pflicht aktiviert werden. Weder vorhandener Draft-PASS noch dieser Binärtest sind eine Produktionsfreigabe.

Original-Run: https://github.com/MeteoMartini/MID/actions/runs/43866924798 — GitHub-Actions-Artefakt-API: https://docs.github.com/en/rest/actions/artifacts — Immutable-Releases-Konzept: https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases
