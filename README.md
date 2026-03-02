# api-diff
> Compare two API endpoints or JSON files. Spot breaking changes instantly.

```bash
npx api-diff https://api.example.com/users https://api.staging.com/users
```

```
api-diff results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
source1: https://api.example.com/users
source2: https://api.staging.com/users

~ users[0].email      "nick@prod.com" → "nick@staging.com"
+ users[0].role       "admin" (new)
- users[1].verified   true (removed)
~ meta.total          142 → 143

Summary: 1 added · 1 removed · 2 changed · 47 identical
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Commands
| Command | Description |
|---------|-------------|
| `api-diff <src1> <src2>` | Compare two URLs or JSON files |
| `--only-changes` | Hide identical fields |
| `--ignore <path>` | Ignore a field path (repeatable) |
| `--key <field>` | Match arrays by this field (e.g. id) |
| `--depth N` | Max diff depth |
| `--format json\|table\|minimal` | Output format |
| `--auth "Bearer $TOKEN"` | Auth header (reads env vars) |
| `--exit-code` | Exit 1 if diffs found (CI-friendly) |
| `--save <file>` | Save diff to JSON |

## Install
```bash
npx api-diff <src1> <src2>
npm install -g api-diff
```

---
**Zero dependencies** · **Node 18+** · Made by [NickCirv](https://github.com/NickCirv) · MIT
