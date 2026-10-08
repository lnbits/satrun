# Sat Run

Single-player 3D light circuit for LNbits WASM. Climb a seeded daily course, outrun the rising void and compete by highest completed floor, then time to that floor. The day changes at **00:00 UTC**. There are no prize payouts or paid entries in this MVP.

## Try it

- Owner settings: `/ext/satrun` — create a circuit, then share its player link.
- Free standalone practice: `/ext/satrun/play`.
- Owner records: `/ext/satrun/me?towerId=YOUR_CIRCUIT_ID`.

WASD/arrows move relative to the camera; Space jumps. Drag to orbit, wheel to zoom, C resets the camera, Escape pauses. Touch devices have a joystick and jump button. Fresh runs have one total life, consumed on death. Seeded pickups grant an extra life or five seconds of automatic upward flight with normal steering (hazards still hurt). Extra lives permit checkpoint resumes; at zero, paid resumes use the owner's fixed price and receiving wallet and restore one life. Collected pickups cannot be farmed by resuming. Free and paid resumes count toward daily rankings with cumulative gameplay time. A payment buys one resume. A fresh restart is always free.

Signed-in personal records persist in LNbits. Guests keep records in browser and tab-session storage. Personal records include practice runs; they are separate from daily leaderboard results.

## Build and check

Requires Node and the pinned dependencies in `dev/package-lock.json`:

```sh
cd dev
npm ci
npm test
npm run build
```

`node dev/build.mjs --ui` rebuilds only the browser bundle. Build tools/source stay outside the install archive. `dev/runtime.json` records the target runtime: LNbits `b717d51d7b6c099cb5cb4d730e59c6aa720e5365`.

Development checks (from the workspace directory):

```sh
../lnbits_pg/.venv/bin/python sat-run/dev/runtime-check.py --reset
node sat-run/dev/live-check.mjs
node sat-run/dev/browser-check.mjs
node sat-run/dev/owner-check.mjs
node sat-run/dev/camera-check.mjs
node sat-run/dev/checkpoint-check.mjs
../lnbits_pg/.venv/bin/python sat-run/dev/pg-check.py
```

The isolated server uses port 5022 and FakeWallet; PostgreSQL checks create and delete a disposable database and use port 5023. They never restart the shared server or spend real sats. Test credentials and databases are ignored by Git and excluded from packages.

## Trust boundaries and limits

The backend creates run seeds and validates compact checkpoint/death reports. It checks progress and timing against previous saved milestones and its own clock, validates collected pickup IDs against the seeded course, and derives remaining lives itself. Browser positions, lives, prices and wallets do not control stored results or invoices. Invoice receipts come only from settled LNbits invoice-paid events. Owner wallets and records are owner-scoped. Public players do not receive wallet IDs or credentials.

These are plausibility checks, not a replay of jumps or collisions. A determined player can fabricate a believable run; aliases, bots and assisted play remain unverified. The user accepted this compromise for the free leaderboard with no prizes. Paid competitive entry, pots, jackpots and payouts remain deferred.

Ordinary movement sends no requests. Only checkpoints and death submit reports, with ordered retry handling; starts/resumes and final score publication use their existing calls. Compact snapshots are stored at these milestones. No input logs or signed intermediate states are produced. Legacy snapshot formats remain readable; migration 3's unused signing-key field remains for existing installations, with no new migration needed. The runtime connection-pool fix is still required, but database work occurs much less frequently.

See `evidence/VERIFICATION.md` for actual checks and limits.

Reload the extension after replacing the component/config, then reload the game and start a fresh run. Existing circuits, scores and paid-resume receipts are preserved.

## Release preparation

Version `0.1.0` targets the WASM runtime recorded in `dev/runtime.json`; it is not a Python extension. Current released LNbits versions without this WASM contract cannot install it. The upstream database connection-reuse fix is still required for sustained PostgreSQL use.

The discovery manifest targets `lnbits/satrun`, following Bean Show. Configure the GitHub repository with `main` as its default branch and an `EXT_GITHUB` secret that can push branches and open pull requests in `lnbits/lnbits-extensions-wasm`.

```sh
python3 dev/check-release.py
node dev/recovery-check.mjs
python3 dev/package-release.py
```

The ZIP is `dist/satrun-0.1.0.zip`. It includes the component, UI/assets, licenses, schema and all migrations beneath one `satrun/` directory. Packaging checks every archived byte against the source and writes SHA256 evidence to `evidence/package.json`.

GitHub build checks install pinned dependencies, rebuild both artifacts, run domain and request-queue tests, inspect the archive and check the committed browser bundle. Release pushes to `main` run those checks before creating a missing `v<config.version>` tag and GitHub release. Matching tag pushes also validate before publishing. Existing tags on `main` are skipped; bump the config and game-info versions together for a later release. The final job proposes the marketplace version update through a pull request.

LNbits consumes GitHub's source ZIP for the tag, as in Bean Show; `.gitattributes` excludes developer scripts, workflows, evidence and caches while retaining storage migrations. Commit the generated browser bundle and component before pushing. Preparing these files locally does not publish a release.
