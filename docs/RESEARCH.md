# api-diff — documentation research

Reviewed 21 September 2026. Public GitHub source only.

## Revision and scope

- Commit: [`0e87551bb94e9acb10f84c96ed36f2fe94730864`](https://github.com/NickCirv/api-diff/commit/0e87551bb94e9acb10f84c96ed36f2fe94730864).
- Tree: `07b1a3c011bb2c1547fd25f8b70dd6587140b781`; truncated: `false`.
- Capture: 6 of 6 eligible text files; all eligible text files.
- Method: package and entrypoint inspection, implementation-interface review, targeted behavior/limitation inspection, and test-source review. This is not an exhaustive correctness or security audit.
- Commands run against repository code: **none**. External services, deployment and npm publication were not verified.

## Claim and evidence map

| Documentation claim | Pinned evidence | Assessment |
| --- | --- | --- |
| Runtime, executable and development commands | [package.json](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/package.json) | Source declaration inspected; runtime unverified |
| Compares two JSON files or HTTP responses to expose added, removed and changed values. | [index.js](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/index.js) | Implementation interfaces inspected; behavior not executed |
| Nested comparisons; array matching by key; depth and ignore controls; table, minimal or JSON output; optional JSON export. | [index.js](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/index.js) | Source-backed scope, not a test result |
| Array matching and ignored paths affect what changes are visible. URL inputs make HTTP requests; request bodies and authorization headers must match the endpoint. A schema diff is not a compatibility proof. | [index.js](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/index.js) | Material limits documented; service compatibility remains open |
| Existing checks | [test/smoke.test.js](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/test/smoke.test.js) | Test source read; no passing-run claim |

## Documentation inventory and disposition

| Existing document | Decision |
| --- | --- |
| [README.md](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/README.md) | Rewritten with source-specific purpose, direct checkout setup, limitations and verification status. Old section fragments retained where practical. |

Added `docs/REFERENCE.md` for the observed implementation and command surface, and this research record. Protected license and attribution files remain in their original locations without edits. No source or product UI was changed.

## Quality dimensions

| Dimension | Status | Evidence / next step |
| --- | --- | --- |
| Pinned provenance | Verified | Captured commit, tree and per-file hashes recorded below |
| Interface documentation | Partially verified | Source inspection only; run clean-checkout quickstart |
| Runtime behavior | Unverified | No repository execution in this review |
| Test results | Unverified | Existing tests were not run |
| Deployment / package availability | Unverified | No remote publish or live-service check |
| Visual / link checks | Unverified | Portfolio renderer and independent QA are separate from this authoring step |

## Editorial follow-up

Restored flag meanings/defaults and exit behavior. Flagged body-bearing HTTP requests for targeted runtime testing because the fetch path calls http(s).get before writing a body.

## Unresolved issues

Array matching and ignored paths affect what changes are visible. URL inputs make HTTP requests; request bodies and authorization headers must match the endpoint. A schema diff is not a compatibility proof.

## Captured source inventory

This lists captured provenance, not a claim that every line received a full audit. Binary/generated/excluded files are outside the eligible text capture.

| File | SHA-256 | Bytes |
| --- | --- | --- |
| [LICENSE](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/LICENSE) | `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d` | 1072 |
| [README.md](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/README.md) | `dcd7b2a8bb7b88485536342277a3c60fd9f3a166739fce3cf5505b27f223db74` | 2039 |
| [package.json](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/package.json) | `0781fb60dd774111dfab43e85a482c01cf7780ef956aee50c8419db418aa51ff` | 556 |
| [.github/workflows/ci.yml](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/.github/workflows/ci.yml) | `433fbf65635a767ef5cd787147104c248d0cea6bbd6523c6c862f915e0e3206a` | 384 |
| [index.js](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/index.js) | `e2c284540c0b9d04b0ea0c1c39a944c61296637a78bc54fbcd1010a495c7d5de` | 15684 |
| [test/smoke.test.js](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/test/smoke.test.js) | `4e107fe059a90eaaa70dc98e0563d1c6f6e66e9e692b7525f16ce8dcb3755ffa` | 453 |
