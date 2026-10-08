# Sat Run runtime contract

Target LNbits: `b717d51d7b6c099cb5cb4d730e59c6aa720e5365`.
No core changes. All iframe APIs use the parent MessagePort bridge.

| Action | Context/export | Host capabilities | Stored/public data |
|---|---|---|---|
| Daily seed | public / game-info | system time | UTC date, defaults |
| Personal records | authenticated / get-record, save-record | owner storage | unranked personal maxima |
| Circuit settings | authenticated / operator-config | owner storage, wallet list, random IDs | private wallet; public bounded settings |
| Circuit info | public / tower-info | public read | excludes wallet/source credentials |
| Start/resume run | public / begin-run | public read/append, time, random IDs | server seed, token, replay state, lives and pickups; verified receipt after life exhaustion |
| Verify input | public / verify-run, owner context from run_nodes/runId | owner read, public append at checkpoint/death, time | private signing key; MAC-authenticated transient state; no client position/score claims |
| Finish/rank | public / finish-run, leaderboard | public append/read/pagination | derived floor/time; highest floor then fastest time |
| Resume invoice | public / continue-invoice | public read, fixed-source invoice | only verified dead checkpoint with no remaining lives |
| Paid receipt | event / invoice-paid | owner storage | idempotent payment hash, validated amount/source/wallet |
| Receipt status | public / continue-status | public read | paid flag, checkpoint and circuit only |

No API exposes invoice-paid. Immutable invoice sources preserve outstanding invoices when operator configuration changes. Public append ownership comes from the circuit source; callers cannot choose source-owner fields. Owner rows use random IDs and owner-scoped pagination. Payment receipts are deterministic by hash. Records reconcile maxima, with concurrent saves last-writer-wins.

Public run nodes are append-only. Tokens protect individual run handles; replay forks and assisted/bot play cannot be prevented with this runtime. This does not authorize prize payouts or promise single-use payment consumption under concurrent replay. Continued guest practice is local; daily scores always come from backend simulation. Daily rounds switch at 00:00 UTC without a scheduler or payout task.

The course has one current ruleset and one leaderboard per circuit/day. New obstacles use deterministic front/side disc volleys, staggered later gates, alternating precision steps and rotating slabs. Sparse seeded extra-life/5-second flight pickups use replay state, with collected IDs preserved across resumes. One total life is consumed on death; a paid resume restores one life. Existing daily scores remain visible without revision filtering. No new exports or host imports. Migration 3 adds private `run_nodes.signing_key`; public append allows this server-generated field, public reads exclude it. `/run/verify` resolves owner context from `runId`. Pinned `@noble/hashes` supplies keyed BLAKE3 inside the component; no Web Crypto or custom hash implementation. Inputs upload at checkpoints/death in chunks of at most 60 frames. Intermediate chunks read the key but write nothing; only checkpoint/death advances append new immutable snapshots. Client proof authenticates state and run ID; it does not prevent existing replay forks. A signed proof remains usable across component instantiations/restarts. Reload and start a fresh run after course updates.
