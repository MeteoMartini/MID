# MID .445 – tatsächliches Fade-Ende statt Zeitannahme

Release recovery for PR679 .444. Published Stable remains .443 fda79a1683ec78cdf602416b2a5486a9f9512a9a. The exact known main lineage is PR679 head6ddb6634332a3610608120c45b613e0005e807bf → controlled merge2845fb6ec6eba39d88bef5110e0e4aab9bbfab11 → server ZIP5164a325cc88507afa1b5b1a569b12bbd9b21e3e. All original handoff code is preserved. The recovery branch starts at verified Stable and fast-forwards through this exact failed-release lineage; no reset, force push or unrelated code intake.

## Evidence and cause

Source Gate42312155373 passed completely, including the map memory case. Installer42313498206 failed in heavy-unified-map2/3, job128220494792: page.waitForFunction timeout30000ms at verify-unified-map-browser-0985167.mjs:241. All seven ordinary cases in that shard had passed. The remaining condition requires exactly one synoptic-thetae raster after a model switch during20 memory cycles.

The deterministic image-layer harness reproduces two surviving layers instead of one when a timer runs before delayed animation frames. Wall time can pass beyond the350ms fade deadline while RAF has not completed. A new raster is promoted during the previous fade; the older callback overwrites the current frame list. Another selection can then leave an orphan layer. This is a production lifecycle race, not evidence that the timeout should increase or that the assertion should be skipped.

## Fix and validation

The renderer tracks whether the fade actually remains active. A decoded successor waits in a cancellable20ms timer until the preceding RAF has completed, instead of treating elapsed time as completion. Unmount clears the active flag and existing cancellation remains intact. GPU readiness, prior image retention, errors, validity callbacks, reduced motion, opacity, data values and meteorological provenance are preserved.

The existing lifecycle regression now includes the adversarial timer-before-RAF sequence. It fails against the previous renderer (actual2, expected1) and passes against the fix. All23 existing cache/pointer/NoData/glyph/contour/export groups still pass under Node22.16.0. Real browser diagnostics and the full Source/Installer gates are recorded separately; no mocked harness is represented as physical iOS evidence. The complete viewport/theme matrix, original20 memory cycles and strict30000ms condition remain unchanged. No blind retry of the unknown installer failure.

The independent AP1b original remains Draft681; all original hashes match,10 offline tests pass, but GRIB reads are blocked by the execution proxy403 and all three real runs remain NOT VERIFIED. It is not part of this production map fix.

Targeted real Chromium 141 / Playwright1.56.1 diagnostic on the corrected tree: full original memory-case setup plus two warmups and all20 model round trips passed in47.6s, cycle-p95 648.38ms. A trace was recorded. This targeted scenario is explicitly not the complete release matrix and not a physical-iOS or leak verdict. Production TypeScript/Vite build and focused map/cloud/handoff checks also passed. The independent unchanged browser matrix remains mandatory in Source and Installer.

## Independent signal-fixture race found by full Source gate

Source42315193343 Core4/4 failed in test-ruc-lifecycle-0985344.mjs: Python exited by SIGTERM (Node status null) before the parent-term finish record. The fixture sent SIGTERM after a fixed150ms, whereas run() writes/fsyncs its start record before installing the handlers. Injecting a250ms fsync delay reproduces original test exit -15 deterministically. The test now waits for a real child-created marker, which is possible only after handler installation and child spawn, before sending the same real SIGTERM. All exact reason/signal/exit/row-count and descendant-cleanup assertions remain. A separate slow-fsync case preserves this race regression. Production timed_command.py, its signal behavior, timeouts and lifecycle contract are unchanged. This is fixture synchronization, not a weakened acceptance criterion or blind rerun.
