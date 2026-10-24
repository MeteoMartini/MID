# MID-C41: native RUC runtime isolation (.322 candidate)

Base: main = mid-stable = 205d4c6bf8f9799c9f4ef38f31d20b7940470ced (.321).
Existing candidate PR #457 head ff0fefcd8977e136f22feeaec71e3ad13c801a05.

## Reproduced failure, 2026-10-24

Production job 120889562124 (run 40099846678) prints the final valid
storage summary, then exits 139 (SIGSEGV). This is not a successful publish.
A local Python 3.12.14 subprocess reproduces native teardown failure without
any downloads: `import eccodes; import pyproj` exits -6 / SIGABRT with
`free(): invalid pointer`, on all three repeated executions. Each library alone
and `import pyproj; import eccodes` exit 0 on all three attempts.
All other 14 two-library combinations across eccodes/numpy/scipy/h5py/pyproj/
contourpy exit normally. Local versions: eccodes 2.50.0, pyproj 3.8.0,
h5py 3.16.0, numpy 2.3.5, scipy 1.17.0, contourpy 1.3.3.

The failing process maps distinct eckitlib and pyproj bundled libproj/libcurl
libraries. This supports a native runtime interaction; the exact C symbol or
allocator responsible has NOT been identified. Local and hosted versions of
numpy/scipy differ, so local reproduction does not substitute for hosted CI.

## Fix and regression

Keep ecCodes model builders and pyproj/HDF5 observations in separate child
interpreters, including normal interpreter teardown. Do not use os._exit,
change import order as a workaround, or ignore child return codes.
The parent imports neither native stack. The new real-import regression checks
all five actual builder/parent modules, asserts absence of the other runtime,
and requires normal child exit. It performs no network requests.
The existing Source-PR offline step executes this regression; production packing
also enables Python faulthandler for any remaining fatal signal. Python 3.12
supports PYTHONFAULTHANDLER; newer c_stack parameters are deliberately not used.

## Identity and release boundaries

Active Trusted Agent Branches ruleset 23917545 explicitly lists User 75040651
and Integration 1144995. The connected actor is User 75040651. Production Branch
Guard 23963851 permits only Integration 5059236, and reports user bypass never.
The existing PR457 branch-creation/readback evidence proves integration transport;
it is distinct from the SHA-bound MID Agent Source Release bot token and installer.
No rulesets, credentials, budgets, Missing semantics or promotion controls change.

## Acceptance still required

A complete fresh data candidate, full lossless verification and independent
Source/Heavy/Installer/Worker/Pages/Stable evidence remain required before
claiming release or closing #352. Drafts #425/#433/#449 remain separate.
