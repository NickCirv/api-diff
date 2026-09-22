# api-diff — implementation reference

Source revision: `0e87551bb94e9acb10f84c96ed36f2fe94730864`. This reference records source declarations; it is not a transcript of a successful run.

## Entrypoint and runtime

[package.json](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/package.json) declares `index.js`. Node.js `>=18` and npm.

Executable mapping: `api-diff` → `./index.js`, `adiff` → `./index.js`.

## Supported workflow

Nested comparisons; array matching by key; depth and ignore controls; table, minimal or JSON output; optional JSON export.

Array matching and ignored paths affect what changes are visible. URL inputs make HTTP requests; request bodies and authorization headers must match the endpoint. A schema diff is not a compatibility proof.

## Command reference

The commands below use the installed executable name. From the pinned checkout, replace it with the `node` entrypoint shown above. Options and command branches were cross-checked against captured source; examples are not execution transcripts.

| Flag | Description |
|------|-------------|
| `--only-changes` | Hide identical fields, show only diffs |
| `--ignore <path>` | Ignore a field path (repeatable) |
| `--key <field>` | Match arrays by this field (e.g. `id`) |
| `--depth N` | Max diff depth (default: unlimited) |
| `--format json\|table\|minimal` | Output format (default: `table`) |
| `--auth "Bearer $TOKEN"` | Auth header — reads env vars |
| `--method GET\|POST` | HTTP method (default: `GET`) |
| `--body '{"k":"v"}'` | Request body for POST |
| `--save <file>` | Save diff result to JSON |
| `--exit-code` | Exit 1 if diffs found (CI-friendly) |
| `-h, --help` | Show help |

## Comparison defaults and exits

Supply exactly two local JSON paths or URLs. `--only-changes` defaults to false, depth is unlimited, ignore paths are empty, array matching has no key, output is `table`, HTTP method is `GET`, and authorization/body/save are unset. Arrays use the normal indexed comparison unless `--key FIELD` is supplied. Repeat `--ignore PATH` for multiple fields.

```sh
node index.js before.json after.json --key id --ignore timestamp --format json --exit-code
```

A completed comparison normally exits `0` even when values differ. `--exit-code` changes differences into exit `1`; source-loading/parse errors also fail. `--save FILE` writes the result to a local JSON file. URL requests use a 10-second timeout and require successful JSON responses; redirects are not handled as a browser session.

`--auth` resolves `$VARIABLE` references internally. To avoid shell substitution, pass a single-quoted value such as `--auth 'Bearer $API_TOKEN'`. The parser accepts `--method` and `--body`, but the fetch implementation uses the convenience HTTP `get` function before writing a body; body-bearing requests need a targeted runtime test before relying on POST behavior.

## Package scripts

| Script | Exact command |
| --- | --- |
| `test` | `node --test` |

## Implementation sources

[index.js](https://github.com/NickCirv/api-diff/blob/0e87551bb94e9acb10f84c96ed36f2fe94730864/index.js).

## Verification boundary

No repository code, tests, network operation, hook installer or migration was executed for this review. Source inspection supports the documented interface; runtime correctness and external-service compatibility remain unverified.
