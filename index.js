#!/usr/bin/env node
// api-diff — Compare two API endpoints or JSON files
// Zero dependencies. Node 18+.

import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { get as httpGet } from 'http';
import { get as httpsGet } from 'https';

// ─── ANSI Colors ─────────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
};

function green(s)  { return `${C.green}${s}${C.reset}`; }
function red(s)    { return `${C.red}${s}${C.reset}`; }
function yellow(s) { return `${C.yellow}${s}${C.reset}`; }
function cyan(s)   { return `${C.cyan}${s}${C.reset}`; }
function bold(s)   { return `${C.bold}${s}${C.reset}`; }
function dim(s)    { return `${C.dim}${s}${C.reset}`; }

// ─── Argument Parsing ─────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {
    sources: [],
    onlyChanges: false,
    depth: Infinity,
    ignore: [],
    format: 'table',
    auth: null,
    method: 'GET',
    body: null,
    save: null,
    exitCode: false,
    key: null,
    help: false,
  };

  const flags = argv.slice(2);
  let i = 0;
  while (i < flags.length) {
    const f = flags[i];
    switch (f) {
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--only-changes':
        args.onlyChanges = true;
        break;
      case '--exit-code':
        args.exitCode = true;
        break;
      case '--depth':
        args.depth = parseInt(flags[++i], 10);
        break;
      case '--ignore':
        args.ignore.push(flags[++i]);
        break;
      case '--format':
        args.format = flags[++i];
        break;
      case '--auth':
        args.auth = flags[++i];
        break;
      case '--method':
        args.method = flags[++i].toUpperCase();
        break;
      case '--body':
        args.body = flags[++i];
        break;
      case '--save':
        args.save = flags[++i];
        break;
      case '--key':
        args.key = flags[++i];
        break;
      default:
        if (!f.startsWith('--')) {
          args.sources.push(f);
        }
    }
    i++;
  }
  return args;
}

// ─── Help ─────────────────────────────────────────────────────────────────────
function showHelp() {
  console.log(`
${bold('api-diff')} — Compare two API endpoints or JSON files

${bold('Usage:')}
  npx api-diff <src1> <src2> [options]

${bold('Sources:')}
  URL or local JSON file path

${bold('Options:')}
  --only-changes        Hide identical fields, show only diffs
  --ignore <path>       Ignore a field path (repeatable)
  --key <field>         Match arrays by this field (e.g. id)
  --depth N             Max diff depth (default: unlimited)
  --format json|table|minimal  Output format (default: table)
  --auth "Bearer $TOKEN"       Auth header (reads env vars for $VAR)
  --method GET|POST     HTTP method (default: GET)
  --body '{"k":"v"}'   Request body for POST
  --save <file>         Save diff result to JSON file
  --exit-code           Exit 1 if diffs found (CI-friendly)
  -h, --help            Show this help

${bold('Examples:')}
  npx api-diff https://api.example.com/users https://api.staging.com/users
  npx api-diff response1.json response2.json --only-changes
  npx api-diff <src1> <src2> --ignore timestamp --ignore id
  npx api-diff <src1> <src2> --key id --format json
  npx api-diff <src1> <src2> --auth "Bearer $MY_TOKEN" --exit-code
`);
}

// ─── HTTP Fetch ───────────────────────────────────────────────────────────────
function resolveAuth(authStr) {
  if (!authStr) return null;
  // Replace $VAR with process.env[VAR] — never log the value
  return authStr.replace(/\$([A-Z0-9_]+)/g, (_, varName) => {
    const val = process.env[varName];
    if (!val) {
      console.error(red(`Error: Environment variable $${varName} is not set`));
      process.exit(1);
    }
    return val;
  });
}

function fetchUrl(url, { method = 'GET', body = null, auth = null } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const getter = isHttps ? httpsGet : httpGet;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'api-diff/1.0.0',
      },
      timeout: 10000,
    };

    if (auth) {
      options.headers['Authorization'] = auth;
    }
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = getter(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Invalid JSON from ${url} (status ${res.statusCode})`));
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out: ${url}`));
    });
    req.on('error', (e) => {
      reject(new Error(`Connection error for ${url}: ${e.message}`));
    });

    if (body) req.write(body);
    req.end();
  });
}

// ─── Load Source ──────────────────────────────────────────────────────────────
async function loadSource(src, fetchOpts) {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return fetchUrl(src, fetchOpts);
  }
  // Local file
  try {
    const content = readFileSync(src, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`Cannot read file "${src}": ${e.message}`);
  }
}

// ─── Deep Diff ────────────────────────────────────────────────────────────────
// Returns array of diff entries: { type: 'added'|'removed'|'changed'|'same', path, val1, val2 }
function deepDiff(a, b, path = '', depth = 0, maxDepth = Infinity, matchKey = null) {
  const diffs = [];

  if (depth > maxDepth) return diffs;

  // Type check
  const typeA = getType(a);
  const typeB = getType(b);

  if (typeA !== typeB) {
    diffs.push({ type: 'changed', path, val1: a, val2: b, note: `type ${typeA} → ${typeB}` });
    return diffs;
  }

  // Arrays
  if (typeA === 'array') {
    if (matchKey && a.length > 0 && typeof a[0] === 'object' && a[0] !== null) {
      // Smart array matching by key
      return diffArraysByKey(a, b, path, depth, maxDepth, matchKey);
    }
    // Index-based array diff
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
      const p = path ? `${path}[${i}]` : `[${i}]`;
      if (i >= a.length) {
        collectAll(b[i], p, 'added', diffs);
      } else if (i >= b.length) {
        collectAll(a[i], p, 'removed', diffs);
      } else {
        diffs.push(...deepDiff(a[i], b[i], p, depth + 1, maxDepth, matchKey));
      }
    }
    return diffs;
  }

  // Objects
  if (typeA === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    const allKeys = new Set([...keysA, ...keysB]);

    for (const key of allKeys) {
      const p = path ? `${path}.${key}` : key;
      if (!(key in a)) {
        collectAll(b[key], p, 'added', diffs);
      } else if (!(key in b)) {
        collectAll(a[key], p, 'removed', diffs);
      } else {
        diffs.push(...deepDiff(a[key], b[key], p, depth + 1, maxDepth, matchKey));
      }
    }
    return diffs;
  }

  // Primitives
  if (a === b) {
    diffs.push({ type: 'same', path, val1: a, val2: b });
  } else {
    diffs.push({ type: 'changed', path, val1: a, val2: b });
  }
  return diffs;
}

function diffArraysByKey(a, b, path, depth, maxDepth, matchKey) {
  const diffs = [];
  const mapA = new Map(a.map(item => [String(item[matchKey]), item]));
  const mapB = new Map(b.map(item => [String(item[matchKey]), item]));
  const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);

  for (const k of allKeys) {
    const p = `${path}[${matchKey}=${k}]`;
    if (!mapA.has(k)) {
      collectAll(mapB.get(k), p, 'added', diffs);
    } else if (!mapB.has(k)) {
      collectAll(mapA.get(k), p, 'removed', diffs);
    } else {
      diffs.push(...deepDiff(mapA.get(k), mapB.get(k), p, depth + 1, maxDepth, matchKey));
    }
  }
  return diffs;
}

function collectAll(val, path, type, diffs) {
  const t = getType(val);
  if (t === 'object') {
    for (const [k, v] of Object.entries(val)) {
      collectAll(v, `${path}.${k}`, type, diffs);
    }
  } else if (t === 'array') {
    val.forEach((v, i) => collectAll(v, `${path}[${i}]`, type, diffs));
  } else {
    diffs.push({ type, path, val1: type === 'removed' ? val : undefined, val2: type === 'added' ? val : undefined });
  }
}

function getType(val) {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val;
}

// ─── Format Value ─────────────────────────────────────────────────────────────
function fmtVal(val) {
  if (val === undefined) return '';
  if (val === null) return 'null';
  if (typeof val === 'string') return `"${val}"`;
  return String(val);
}

// ─── Output Renderers ─────────────────────────────────────────────────────────
function renderTable(diffs, onlyChanges) {
  const lines = [];
  for (const d of diffs) {
    if (onlyChanges && d.type === 'same') continue;
    switch (d.type) {
      case 'added':
        lines.push(green(`+ ${d.path.padEnd(40)} ${fmtVal(d.val2)} (new)`));
        break;
      case 'removed':
        lines.push(red(`- ${d.path.padEnd(40)} ${fmtVal(d.val1)} (removed)`));
        break;
      case 'changed':
        lines.push(yellow(`~ ${d.path.padEnd(40)} ${fmtVal(d.val1)} → ${fmtVal(d.val2)}${d.note ? ` [${d.note}]` : ''}`));
        break;
      case 'same':
        lines.push(dim(`  ${d.path.padEnd(40)} ${fmtVal(d.val1)}`));
        break;
    }
  }
  return lines.join('\n');
}

function renderMinimal(diffs, onlyChanges) {
  const lines = [];
  for (const d of diffs) {
    if (d.type === 'same') continue;
    switch (d.type) {
      case 'added':   lines.push(`+ ${d.path}: ${fmtVal(d.val2)}`); break;
      case 'removed': lines.push(`- ${d.path}: ${fmtVal(d.val1)}`); break;
      case 'changed': lines.push(`~ ${d.path}: ${fmtVal(d.val1)} -> ${fmtVal(d.val2)}`); break;
    }
  }
  return lines.join('\n');
}

function renderJson(diffs, summary, src1, src2) {
  return JSON.stringify({
    source1: src1,
    source2: src2,
    summary,
    diffs: diffs.filter(d => d.type !== 'same').map(d => ({
      type: d.type,
      path: d.path,
      ...(d.val1 !== undefined ? { before: d.val1 } : {}),
      ...(d.val2 !== undefined ? { after: d.val2 } : {}),
      ...(d.note ? { note: d.note } : {}),
    })),
  }, null, 2);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv);

  if (args.help || args.sources.length === 0) {
    showHelp();
    process.exit(0);
  }

  if (args.sources.length < 2) {
    console.error(red('Error: Two sources required'));
    console.error(dim('Usage: api-diff <src1> <src2> [options]'));
    process.exit(1);
  }

  const [src1, src2] = args.sources;
  const authHeader = resolveAuth(args.auth);

  const fetchOpts = {
    method: args.method,
    body: args.body,
    auth: authHeader,
  };

  // Load both sources in parallel
  let data1, data2;
  try {
    [data1, data2] = await Promise.all([
      loadSource(src1, fetchOpts),
      loadSource(src2, fetchOpts),
    ]);
  } catch (e) {
    console.error(red(`Error loading source: ${e.message}`));
    process.exit(1);
  }

  // Compute diff
  let diffs = deepDiff(data1, data2, '', 0, args.depth, args.key);

  // Apply ignore filters
  if (args.ignore.length > 0) {
    diffs = diffs.filter(d => {
      return !args.ignore.some(ig => d.path === ig || d.path.startsWith(ig + '.') || d.path.startsWith(ig + '['));
    });
  }

  // Summary stats
  const summary = {
    added: diffs.filter(d => d.type === 'added').length,
    removed: diffs.filter(d => d.type === 'removed').length,
    changed: diffs.filter(d => d.type === 'changed').length,
    identical: diffs.filter(d => d.type === 'same').length,
  };
  const hasDiffs = summary.added + summary.removed + summary.changed > 0;

  // JSON format: output and optionally save
  if (args.format === 'json') {
    const out = renderJson(diffs, summary, src1, src2);
    console.log(out);
    if (args.save) {
      writeFileSync(args.save, out, 'utf8');
    }
    if (args.exitCode && hasDiffs) process.exit(1);
    return;
  }

  // Minimal format
  if (args.format === 'minimal') {
    const out = renderMinimal(diffs, args.onlyChanges);
    if (out) console.log(out);
    const summaryLine = `${summary.added} added · ${summary.removed} removed · ${summary.changed} changed · ${summary.identical} identical`;
    console.log(dim(summaryLine));
    if (args.save) {
      writeFileSync(args.save, renderJson(diffs, summary, src1, src2), 'utf8');
    }
    if (args.exitCode && hasDiffs) process.exit(1);
    return;
  }

  // Table format (default)
  const sep = bold('━'.repeat(53));
  console.log('');
  console.log(cyan(bold('api-diff results')));
  console.log(sep);
  console.log(dim(`source1: ${src1}`));
  console.log(dim(`source2: ${src2}`));
  console.log('');

  if (!hasDiffs) {
    console.log(green('No differences found. Sources are identical.'));
  } else {
    const body = renderTable(diffs, args.onlyChanges);
    if (body) console.log(body);
  }

  console.log('');
  const summaryStr = [
    summary.added   > 0 ? green(`${summary.added} added`)     : null,
    summary.removed > 0 ? red(`${summary.removed} removed`)   : null,
    summary.changed > 0 ? yellow(`${summary.changed} changed`) : null,
    dim(`${summary.identical} identical`),
  ].filter(Boolean).join(dim(' · '));
  console.log(`${bold('Summary:')} ${summaryStr}`);
  console.log(sep);
  console.log('');

  if (args.save) {
    const jsonOut = renderJson(diffs, summary, src1, src2);
    writeFileSync(args.save, jsonOut, 'utf8');
    console.log(dim(`Diff saved to: ${args.save}`));
  }

  if (args.exitCode && hasDiffs) process.exit(1);
}

main().catch(e => {
  console.error(red(`Fatal: ${e.message}`));
  process.exit(1);
});
