# Native Pages cell reader evidence - v0.9.85.412 Draft, not live
The separate ruc_fast_paged_point_shadow.mjs reads original 0-6h DWD
Fast bytes from native immutable Pages chunks, authenticated with an
externally trusted complete SHA256 for the paged manifest.
Contracts: seven hourly, 73 native five-minute, 25 native fifteen-minute
UTC valid times; native 542040 cells/964x596 lookup; twelve
original units/scales; four binary sources SHA checked on original
joint site; fetched four chunks independently SHA checked; NoData != 0.
Correct native four-BIN payload is 253804736 bytes, exclusive of
the previously counted shadow JSON metadata. Manifest cannot grant
publication, R2 writing, User Interface/Widget adoption or SLO.
Needs public Pages readback, legitimate trusted pinned SHA authority,
global producer single-writer/fencing, rollback and 168h client P95.
