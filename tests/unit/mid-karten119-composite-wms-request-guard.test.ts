// MID's Vitest include contract is tests/unit/**/*.test.ts.
// Keep the actual Worker-router fixture as untyped .mjs to avoid injecting
// generated Worker type declarations into the application TypeScript build.
// This static import registers ALL seven suites/tests during Vitest collection;
// the runner must fail if their real Request/Response assertions fail.
import './mid-karten119-composite-wms-request-guard.test.mjs';
