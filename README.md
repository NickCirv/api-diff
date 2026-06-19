<div align="center">

# api-diff

**Spot breaking changes between two API endpoints or JSON files — instantly.**

[![License: MIT](https://img.shields.io/badge/License-MIT-0B0A09?style=flat-square&labelColor=0B0A09&color=4a90d9)](LICENSE)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-0B0A09?style=flat-square&labelColor=0B0A09&color=4a90d9)
![Node ≥18](https://img.shields.io/badge/node-%3E%3D18-0B0A09?style=flat-square&labelColor=0B0A09&color=4a90d9)

</div>

## Install

```bash
npx github:NickCirv/api-diff <src1> <src2>
```

## Usage

```bash
# Compare two live endpoints
npx github:NickCirv/api-diff https://api.example.com/users https://api.staging.com/users

# Compare local JSON files, show only changes
npx github:NickCirv/api-diff response1.json response2.json --only-changes

# CI-friendly: exit 1 if diffs found, ignore timestamps
npx github:NickCirv/api-diff <src1> <src2> --ignore timestamp --exit-code
```

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

## What it does

Fetches two sources (URLs or local JSON files) in parallel, runs a recursive deep-diff, and prints a colour-coded report with added, removed, and changed fields. Smart array matching via `--key` keeps diffs readable even when item order shifts. All output formats (`table`, `minimal`, `json`) are pipe-friendly.

---
<sub>Zero dependencies · Node ≥18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
