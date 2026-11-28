# MID – parallele Vorbereitung von Release-Trains

Diese Arbeitsregel gilt für vom Nutzer autorisierte Folge-Releases. Sie schafft keine neue autonome Aufgabe oder Berechtigung und ersetzt keine bestehenden Verträge.

## Zwei getrennte Arbeitsstände
- Genau ein produktiver Release-Train durchläuft Source-Gate, SHA-Bot-Merge, serverseitiges ZIP, Installer, betroffene Worker/Pages, Stable-Promotion und Katalog.
- Während dessen Laufzeit werden priorisierte Folgepakete auf autorisierten chatgpt/*-/codex/*-Branches vorbereitet: vorhandene Spezial-PRs abgleichen, überlappende Scopes konsolidieren, Herkunfts-SHAs sichern, semantisch integrieren, Regressionen und Reviews bearbeiten, Nutzer-/Technik-Notes und Scope-Abschlussliste fertigstellen.
- Ein Folge-Draft ist nicht mergebar allein weil seine Einzelbausteine grün waren. Bereits kombinierte Prüfungen immer an den exakten HEAD binden. Kein zweiter Ready-Release/Publisher vor vollständiger Vorgängerpromotion.
- Folgepakete nach Priorität, fachlichem Zusammenhang und Risiko schneiden. Kleine vollständige Pakete bevorzugen; offene Abnahme eines unabhängigen Themas darf einen geprüften disjunkten Train nicht unnötig blockieren. Keine Mindestzahl an PRs oder künstliche Bündelung.
- Pro Paket festhalten: Owner-PR, Quellen-/Basis-/HEAD-SHAs, Pfade und Überschneidungen, echte QA-/Review-Belege, ausstehende Geräte-/Originaldatenprüfungen, Release-Notes, Rollback sowie vollständig/teilweise erledigte Issues. Keine historischen grünen Resultate umetikettieren.

## Nach Vorgängerpromotion
1. Main/Stable/Version/Baseline/SoT/Verträge/Rulesets/Rechte sowie parallele PRs frisch prüfen. Bei Drift oder unklarer Provenienz fail closed.
2. Vollständigen neu promoteten Stable-Baum bewahren und nur gesichertes verifiziertes Delta übernehmen. Vor Synchronisation unveröffentlichte Arbeit SHA-verifiziert sichern; kein alter Vollbaum, kein Force-Push.
3. Release-Target an tatsächliche Ausgangs-/Zielversion binden, Notes prüfen; Versionsspiegel ausschließlich im etablierten Installerpfad.
4. Kombinierte QA/Reviews für tatsächlichen neuen HEAD ausführen und dann genau den nächsten Kandidaten regulär Ready markieren. Bestehende Gates bleiben obligatorisch; Vorbereitungsarbeit autorisiert keinen Direktmerge.
5. Vollständige Promotion und Katalog belegen. Erst dann vollständig gelieferte Original-PRs/Issues mit konkretem Release-/Scope-Nachweis schließen; partielle und überholte Scopes ausdrücklich disponieren, Restaufträge erhalten.

## Effiziente Begleitung
Automatische Gates ohne Eingriffsgrund laufen lassen; währenddessen konkret nächste Pakete vorbereiten. Bei Fehler anhand originaler Logs eingreifen. Kein blindes Wiederholen unklarer Aktionen, keine Retry-Schleife, keine Schutz-/Timeout-/Testlockerung zur Beschleunigung. Keine Hintergrundüberwachung, automatische Folgeinferenz oder Zeitplanung behaupten, die nicht tatsächlich eingerichtet wurde.
