# MID 0.9.78.30

## Installer-/Dependency-Audit-Hotfix

GitHub Actions Run #866 scheiterte nicht an MID-Fachcode, TypeScript oder Vite, sondern im Schritt `audit:dependencies`. `npm ci` war erfolgreich; anschließend meldete npm 10 beim Audit-Quick-Fallback `Invalid package tree, run npm install to rebuild your package-lock.json`.

Der Lockfile wurde mit Node 22 / npm 10 reproduzierbar neu normalisiert. Dabei wurden drei inkonsistente Paketklassifikationen korrigiert:

- `@types/prop-types`: `devOptional` → `dev`
- `@types/react`: `devOptional` → `dev`
- `csstype`: `devOptional` → `dev`

Zusätzlich schützt `scripts/test-lockfile-audit-tree-097830.mjs` diesen konkreten npm-10-Auditvertrag. Die Fachlogik aus v0.9.78.29 bleibt unverändert.
