# Verification — 2026-10-07

Extension `satrun` 0.1.0. Target LNbits commit
`b717d51d7b6c099cb5cb4d730e59c6aa720e5365`.
Component SHA-256: `f5bcbf4a3808698e569bbf806da57d3f821d98bd398074fb11bba1f4d6533e37`.

## Passed

- `node dev/build.mjs`: real WebAssembly Component produced with jco; loaded by isolated LNbits on port 5022. The first request after replacement hit the runtime deadline during cold compilation; warmed requests passed.
- `node dev/test.mjs`: 40,000 procedural transition envelopes, 30 seeded climbs through ten floors, all six new layouts, jump/coyote/buffer, conveyor direction, replay serialization and backend/payment validation.
- `node dev/live-check.mjs`: actual component replay reaches checkpoint 10; three server-counted free resumes, cumulative time, retry handling, paid FakeWallet event receipt, paid resume eligibility and leaderboard deduplication. Forged tokens, invalid axes, unpaid receipts and client price/wallet/checkpoint claims rejected.
- `node dev/checkpoint-check.mjs`: rendered iframe at floor 15 offers checkpoint 10 with three lives. Three clicks consume three lives; fresh restart restores three. Result controls/status do not overlap. Screenshots captured for all six layouts.
- `node dev/owner-check.mjs`: current reactive settings cross the actual iframe bridge and persist without the former DataCloneError.
- `node dev/camera-check.mjs`: rendered camera-relative forward/right at six angles, actual W movement, runner facing and camera reset (before obstacle renderer additions; camera code unchanged).
- Earlier `node dev/browser-check.mjs`: keyboard/jump, drag/zoom/reset, framing, pause/retry, touch jump, records export fallback, sound toggle, fullscreen, leaderboard dialog and owner navigation. A false-positive owner-save assertion was corrected and separately verified by owner-check.
- Disposable PostgreSQL: migration 2, owner settings/wallets, records, public replay append/read and leaderboard filters/sorting.
- Isolated SQLite server restart preserved circuit and settings.

## Deployment / limits

After explicit user authorization, updated only Sat Run public storage grants on port 5000, preserving wallet permissions and row caps and privately backing up old grants. Migration-2 columns already exist. The runtime reads installed grants per invocation, so no further restart was needed. Main circuit settings, a new run with 3 lives and one-second idle replay append/read passed. No leaderboard score submitted or payment created. Existing open tabs retain old JavaScript until reloaded; their live run is not migrated.

The Lightning invoice was settled through actual isolated HTTP APIs and invoice-paid delivery, not through a physical wallet or a browser QR payment. No human playability, audio listening or physical-device performance claim. Browser rendering uses Chromium SwiftShader.

Replay proves valid simulated inputs, not human play. The runtime lacks atomic run-head updates: concurrent forks/payment reuse remain possible. Sequential retries are idempotent. Aliases are unverified; storage retention/rate limits and atomic progression are prerequisites for prize-bearing competition. Paid entries, pots and payouts are outside this MVP.

## Tron refresh — 2026-10-07

Five three-floor districts with distinct landmarks and palettes (repeat at floor 15); circuit decks, quieter bloom, pale ceramic/amber articulated runner, per-tick landing feedback, district discovery and checkpoint HUD. Fresh clients select course revision 2: generous early landings, wider opening balance bridges, progressive narrowing and faster hazards. Legacy clients/runs/resumes retain original geometry; v2 scores use a separate rules key. No new permissions, migrations or dependencies.

- `node dev/build.mjs`: component rebuilt successfully (sandboxed build was terminated; rerun outside sandbox succeeded). SHA-256 `a80fe370f5cc89b18ae6024db76ac0b791eb12f6527b091af0e5c9a2c007d6e0`.
- `node dev/test.mjs`: 40,000 transitions, 30 seeded climbs and existing gameplay/service/payment checks pass; added early/late difficulty, legacy geometry and ranking separation assertions.
- `node dev/live-check.mjs`: actual updated component, v2 replay, three free lives, simulated paid resume, cumulative timer and v2 leaderboard pass. First cold request timed out; warmed retry passed (same previously observed runtime cold-compilation limit).
- `node dev/visual-check.mjs`: nine course views / all five districts, desktop/mobile layout, keyboard jump, pause/resume/restart and strict CSP passed. Floor review removed signs crowding the player and corrected knee flexion. Extra module views (phase/crumble/conveyor/lift/ice) and the high-contrast pale/amber runner reviewed; extra strict-CSP browser check passed. Final user-requested removal leaves only checkpoint labels in-world; UI rebuilt successfully.

No shared-server restart or real payment. Main installation is the existing symlink, so reload the page for new assets. Human feel, audio listening and physical-device frame rate still require playtesting.

- Final `node dev/browser-check.mjs`: desktop controls, public dialogs and owner save/navigation passed with no JS errors. Mobile iframe visibility timed out before touch validation; this full suite did not pass. Offline mobile layout passed, but physical-device touch/performance remains unverified in this refresh. No further changes requested; awaiting user playtest.

## Obstacles, one total life and one ruleset — 2026-10-07

Current component SHA-256: `28c753e4fa0d120e2d8a260ee3913f4c1741b5ea2ecd92492f4004e43f91a96d`.
Target remains `b717d51d7b6c099cb5cb4d730e59c6aa720e5365`, extension `satrun` 0.1.0.

Added seeded front/side disc volleys, alternating narrow parkour steps, rotating slabs with matching collision/carry, staggered later gates, extra-life and five-second upward-flight pickups. One total life is consumed on death; earned lives permit free checkpoint resumes; payment restores one life at a verified checkpoint. Pickup history persists across resumes. Existing aesthetics retained.

User explicitly rejected course revisions for this unreleased game. Removed version selection and compatibility branches from physics, client, service, admin and API docs. One daily circuit board includes existing scores. Actual main owner and public lobby leaderboard visibly show the user's floor 29 (124.258 seconds); no scores or payments created on main by this check.

Passed:
- `node dev/build.mjs`: rebuilt valid component; runtime detects changed module mtime. Sandboxed compiler stalled, so it was stopped and rerun outside sandbox. Initial cold-load deadline remains a runtime limitation.
- `node dev/test.mjs`: 40,000 current-course jump envelopes, 30 opening climbs, disc hit/jump clearance, rotated landing/carry, staggered gates, pickup collection/expiry/anti-farming, replay, one-life/free-earned-life/paid receipt invariants and single-board regression.
- `node dev/live-check.mjs`: real isolated WASM replay through front-disc course to checkpoint 10, initial life consumed, actual FakeWallet invoice/event/receipt, paid resume restores one life, cumulative time and leaderboard deduplication. The early draft exceeded fuel; bounding hazard checks to nearby rows fixed it. Final warmed run passed all 32 chunks.
- `node dev/visual-check.mjs`: strict CSP, desktop/mobile layout, current scenery and new obstacle views, keyboard jump/pause/restart; no JS errors. New discs/parkour/slabs visually reviewed.
- `node dev/checkpoint-check.mjs`: rendered initial life exhaustion, earned extra-life checkpoint resume and exhaustion, restart restoring one life, no result-control overlap.
- `node dev/browser-check.mjs`: desktop controls/dialogs/owner flow passed; initial mobile release assertion used wall time on slow SwiftShader and failed. Corrected it to inspect cleared input and simulation time. `node dev/browser-check.mjs --mobile` passed real isolated iframe simultaneous movement/jump, joystick left/Jump right, release and cancel. Physical phone performance remains untested.
- `node dev/recovery-check.mjs`: actual client functions retain failed input batches, retry transient errors without losing eligibility, and refuse to silently start practice when a circuit start fails. Client keeps recording during failed verification. Added explicit result-screen verification retry; UI bundle rebuilt.
- `node dev/paid-ui-check.mjs`: actual rendered paid checkpoint button, invoice click and receipt-triggered return to checkpoint with one life under strict CSP. Mock bridge/receipt/QR mount only; actual WASM/FakeWallet separately tested. No real payment.

Main-instance resume failure diagnosed from PostgreSQL logs: `sorry, too many clients already` on run verify/start. Read-only inspection found 95 idle sessions against max_connections=100. One read-only tower-settings request increased open sessions from 95 to 96, confirming connection accumulation. WASM storage constructs a fresh `Database`/SQLAlchemy engine per operation without disposing/reusing it; this strongly indicates pooled connections accumulating. Core remains unchanged under project instructions. Proposed per-extension engine reuse patch: `/tmp/satrun-storage-pool.patch`, helper identity/isolation check passes, awaiting explicit user authorization. Game retries mitigate transient failures but cannot repair exhausted database capacity or recover a run that started without a server handle. No shared restart or connection termination performed.

Real-wallet payment/QR, human feel/audio and physical-device performance remain manual. No prize-grade anti-cheat or concurrent single-use payment claim.

User decision after diagnosis: do not change the WASM runtime. User reports an existing upstream PR for connection management; not inspected. Proposed local patch remains unapplied and approval request is withdrawn. Current verification performs four storage operations per 120-frame batch (roughly one batch per gameplay second): replay read, source-owner lookup, append-cap count and new-state insert. These are sequential and should reuse bounded connections in a corrected runtime.

## Sparse replay persistence — 2026-10-07 (current)

User authorized the game-side storage/input/state change while waiting for the runtime PR. Runtime files remain unchanged. Local and cached remote `wasm_payments_storage` at `e5c3d0483` were inspected: its per-extension/event-loop database cache covers Sat Run's storage calls. That connection fix is still needed; this game change removes intermediate writes, not leaking runtime pools.

Inputs now wait in browser memory until a checkpoint or death. The server replays bounded chunks and returns keyed-BLAKE3 authenticated intermediate state bound to the run ID. Inputs and intermediate state are discarded server-side. Only start/resume, checkpoint advance and death append snapshots. Migration 3 adds a private per-run signing key, excluded from public read policies; the existing append policy allows the server-generated key. `/run/verify` resolves owner context from its run ID and uses a private read. Existing scores remain visible. Reload and start a fresh run after this update.

Geometry is regenerated lazily from the seed. Proofs carry changing player state, relevant crumble/sweeper timers and only new collected IDs/milestones relative to the saved snapshot; saved history prevents pickup farming. Nonfunctional landing timestamps are discarded. The pinned `@noble/hashes` 1.8.0 dependency supplies cryptography; no custom cryptographic algorithm or Web Crypto assumption.

The initial full-snapshot HMAC design exceeded fuel. A disposable real-WASM benchmark measured authentication overhead; keyed BLAKE3 plus compact state reduced it. Moving-run tests still required 60-frame chunks and exclusion of unused trigger timestamps. The final limit is 60 frames, not the earlier proposed 90/120. Intermediate verification uses two storage reads (route owner lookup and private snapshot/key read); checkpoint/death append adds the existing three append operations. Compared with the former 120-frame/four-operation loop, operations per simulated second are roughly unchanged; the measured improvement is eliminating intermediate inserts and storing much smaller snapshots. CPU and request count were not reduced. Public run forks/bots and concurrent single-use payment limits remain as documented.

Final checks:
- `node dev/test.mjs`: existing physics/payment checks, official BLAKE3 keyed-empty vector, altered-state/MAC/cross-run rejection, no intermediate rows, fresh service-instance proof verification, checkpoint/death-only snapshots, compact-state continuation and delta-history preservation.
- `node dev/recovery-check.mjs`: inputs wait until a checkpoint/death; signed handle advances correctly; failed batches remain in order and retry without losing eligibility.
- `node dev/live-check.mjs`: actual final WASM on isolated SQLite/FakeWallet, checkpoint/death uploads, 62 replay chunks, 5 persisted snapshots across start/checkpoint/death/paid-resume/death, matching state, settled invoice/event/receipt, one-life paid resume and ranking/deduplication pass.
- `node dev/replay-budget-check.mjs`: trusted isolated fixtures at floors 29, 40 and 100 pass three actual WASM chunks each, including authenticated continuation, within the unchanged 100M fuel limit.
- `node dev/paid-ui-check.mjs`: rendered paid-checkpoint button, invoice click and settled-receipt transition pass under strict CSP; mock transport/receipt, no real payment.
- `python dev/pg-check.py`: final component, migration 3, settings/records, private-owner signed replay and board queries pass in disposable PostgreSQL.
- Main: applied migration 3 with the runtime migration helper; added only the private append field while preserving existing grants and row caps, with a private backup. Reloaded only Sat Run through its activation control; no shared-server restart or core edits. A fresh main circuit start and two signed replay chunks pass with the same run ID and no intermediate snapshot. No main invoice, payment or score created. Existing owner leaderboard floor-29 score retained.

Final component SHA-256: `a731a74c509c89c578e7e8fb5b36e09d2f49904bae70d8bce56595e44fb83e36`.

Human feel/audio/physical-phone performance and real-wallet QR payment remain manual. PostgreSQL connection counts can still accumulate until the upstream runtime fix is deployed. No concurrent single-use payment or prize-grade anti-cheat claim.


## 2026-10-08 — resume delay and subtle platform glow

The checkpoint/death-only upload schedule accumulated dozens of sequential requests before resume. The browser now sends each full 60-frame batch during play, keeping a single request in flight and flushing only remaining inputs on death. This supersedes the upload timing above. Server verification, authenticated transient state, sparse checkpoint/death persistence and retry behavior are unchanged. Total request count is unchanged (approximately two per simulated second); slow or failed transport can still produce a backlog. No runtime/core, migration, component or payment changes.

- `node dev/build.mjs --ui`: rebuilt the browser bundle at the main extension's existing symlinked path; reload the game page.
- `node dev/recovery-check.mjs`: actual browser functions, 20 simulated seconds at 120 Hz with 150 ms response latency, serial ordered proof chaining, less than one queued batch, at most current plus partial verification after death; lossless retry and circuit-start error handling pass.
- `node dev/paid-ui-check.mjs`: rendered paid checkpoint button, invoice click and settled-receipt resume with one life pass under strict CSP. Mock transport/receipt; no real payment.

Deck emissive intensity .32 → .5; shared district edge/landmark emission 1.1 → 1.6 after the user requested a stronger glow. Palette, geometry and global bloom retained. The full offline visual/control suite passed with the initial smaller bump; a focused `--glow` mode now covers platform/checkpoint views plus desktop/mobile controls for subsequent glow iterations.

- Final `node dev/visual-check.mjs --glow`: stronger platform/checkpoint glow, desktop/mobile layouts, keyboard jump, pause/resume, restart and strict CSP pass with no JS errors. `evidence/tron-steps.png` and `tron-checkpoint.png` show the final glow.


## 2026-10-08 — camera-motion glow flicker

Confirmed a spatial-sampling problem in an isolated camera sweep using the actual game renderer/passes: quarter-CSS-resolution bright extraction and zero composer MSAA let thin neon edges disappear between sample locations. Raising emission made this existing issue visible. Native half-resolution bloom alone reduced the variation but still dropped out, so the final correction extracts bright pixels at the full drawing resolution, retains downsampled blur and uses up to four MSAA samples on composer targets. Glow material intensities and bloom strength/radius/threshold remain unchanged. No backend, component or runtime edits.

- `node dev/build.mjs --ui`: browser bundle rebuilt; existing main extension symlink serves it on reload.
- `node dev/glow-motion-check.mjs`: actual renderer instrumented only in the test bundle, constant thin neon edge, 32 camera positions; old settings reproduce zero-glow frames, corrected settings keep glow visible. Relative brightness variation 1.890 → 0.263 (86% reduction). At 320×240, extraction is 320×240 and blur starts at 160×120; no WebGL/JavaScript errors. Results: `evidence/glow-motion-results.json`.

Synthetic SwiftShader motion test; physical-device shimmer/performance still require user testing. Full-resolution extraction and MSAA increase GPU work.

- Final `node dev/visual-check.mjs --glow`: corrected bundled game passes platform/checkpoint rendering, desktop/mobile layouts, keyboard jump, pause/resume, restart and strict CSP with no JS errors. Final screenshots inspected.


## 2026-10-08 — accepted milestone plausibility checks replace replay

User explicitly accepted lighter checkpoint/death validation and the possibility of believable fake runs. This supersedes all movement-replay/proof/upload descriptions above. Ordinary movement sends no reports. Checkpoint/death reports carry highest floor, elapsed/highest-floor time and collected pickup IDs. Backend validates finite/monotonic progress, checkpoint numbers/order, server-clock limits, conservative forward-speed bounds and seeded/reachable/nonduplicate pickups; it computes lives itself. Existing settled-receipt, amount/wallet/source/checkpoint binding and paid/free resume controls remain in force. No collision/jump replay guarantee.

Removed BLAKE3 code/dependency and transient proofs. Compact historical snapshots remain readable; migration 3's unused private signing-key column remains, with no new migration. Verify route/export retained; ownerContext removed because the handler needs only its declared public row read. Successful retry of the same report reuses the saved snapshot. Gameplay verification notices removed and HUD changed to DAILY RUN; leaderboard copy unchanged at user's explicit request. Renderer untouched.

- `node dev/test.mjs`: physics and 40,000 jump-envelope checks; malformed/out-of-clock/too-fast/backward reports; invalid checkpoint/pickup claims; retry idempotency and conflicting retries; seeded pickup-derived lives, death accounting, free/paid resume, receipt/event invariants, existing daily scores and compact legacy state all pass.
- `node dev/recovery-check.mjs`: zero calls across ordinary pump iterations; immutable checkpoint/death snapshots, serial run-handle chaining, lossless retry and explicit start failure pass.
- `node dev/build.mjs`: successful jco componentization; final SHA256 `a588ff6f55ee5a9f7570cdc1d5fbab0adf5ec26cab6973cf52856238521d91de`.
- `node dev/live-check.mjs`: actual SQLite/WASM/FakeWallet integration, checkpoint 10, death, settled invoice/event/receipt, one-life paid resume and second death, cumulative ranking/deduplication and report retries pass. Three reports and five snapshots; no movement uploads. Results in `evidence/live-results.json`.
- `node dev/paid-ui-check.mjs`: actual bundled UI under strict CSP; normal movement sends zero reports, bot fixture emits checkpoint/death only; result status has no verification message, HUD DAILY RUN; paid button, invoice click and settled-receipt resume pass. Mock browser transport/QR; actual backend payment separately tested above.
- `dev/pg-check.py` against an independent temporary PostgreSQL 16 cluster: migration, owner settings/wallets, personal records, milestone/death append/read, lost-response retry, finish and leaderboard filters pass. Shared-cluster attempts failed with existing TooManyConnectionsError; the independent server avoids changing/terminating main connections. `SATRUN_PG_TEST_URL` enables this isolated test fixture. Temporary cluster stopped.
- Main deployment: reloaded only Sat Run via activation UI, retaining existing permissions/schema/circuits/scores/receipts. Fresh start and one new-style floor-zero death report pass; no finish/leaderboard score/invoice/payment created. No shared-server restart or core edits. Main reload screenshot: `evidence/milestone-update-active.jpg`.

Reload the existing circuit link and start fresh. Remaining runtime pool bug can still accumulate connections, but storage operations now occur only at sparse milestones. Believable fabricated runs, bots/forks and concurrent single-use payment races remain possible; no prizes. Real-wallet/physical-phone tests remain manual.

## Release preparation and records — 2026-10-08

- User confirmed main-game paid checkpoint resume works. Their log shows FakeWallet, sparse checkpoint/death `/run/verify` calls and successful `/run/finish`; this does not establish external Lightning-wallet testing.
- Removed personal-record export/import controls, file parsing/download handlers and unused styles; automatic record persistence and viewing remain. UI-only build preserves the tested component SHA256 `a588ff6f55ee5a9f7570cdc1d5fbab0adf5ec26cab6973cf52856238521d91de`.
- `node dev/test.mjs`, `node dev/recovery-check.mjs`, `node dev/paid-ui-check.mjs` pass, including rendered records with no file controls, strict CSP, sparse reports and paid-resume regression. Screenshot: `evidence/records.png`.
- `python3 dev/check-release.py` passes seven local Git-only release scenarios. Reusable build checks gate release tags; storage and license changes trigger CI. Manifest targets user-confirmed `lnbits/satrun`.
- `python3 dev/package-release.py` produces `dist/satrun-0.1.0.zip`, with 18 files and every byte checked against the source. LNbits `b717d51d7b6c099cb5cb4d730e59c6aa720e5365` successfully loads/validates config and extracts the archive into a disposable directory, preserving module, browser, schema and migration bytes.
- Git source archive produced with an isolated temporary index contains exactly the same runtime files/bytes; workflows, development Python/scripts, credentials, test databases and evidence are excluded. No changes staged, no remote created, no tag/push/publication.
- GitHub Actions/marketplace automation remain unexecuted; configure `EXT_GITHUB` in the destination repository. Upstream runtime connection reuse is still needed for sustained PostgreSQL play. Existing actual-WASM, SQLite, PostgreSQL and payment evidence above applies to the unchanged component.

User subsequently supplied `https://github.com/lnbits/satrun.git`; local origin added and verified. No commits/pushes/tags/releases created.
