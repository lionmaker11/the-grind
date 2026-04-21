#!/usr/bin/env node
/**
 * verify-env.js
 *
 * Audits Vercel env vars for the five critical secrets. Catches the
 * three corruption patterns seen during the V2 build:
 *   - trailing whitespace (including literal \n as two chars 0x5c 0x6e)
 *   - length mismatches vs expected format
 *   - scope mismatches between Production and Preview
 *
 * Usage:
 *   node scripts/verify-env.js
 *
 * Requires: vercel CLI logged in to the correct scope.
 * Not shipped — developer utility only.
 */

import { execSync } from 'node:child_process';
import { readFileSync, unlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SECRETS = [
  { name: 'ANTHROPIC_API_KEY',     expectLength: 108, prefix: 'sk-ant-api' },
  { name: 'GROQ_API_KEY',          expectLength: 56,  prefix: 'gsk_' },
  { name: 'GITHUB_TOKEN',          expectLength: null, prefix: null },
  { name: 'CHIEF_AUTH_TOKEN',      expectLength: null, prefix: null },
  { name: 'VITE_CHIEF_AUTH_TOKEN', expectLength: null, prefix: null }
];

const ENVIRONMENTS = ['production', 'preview'];

function pull(env) {
  const path = join(tmpdir(), `.env.verify.${env}.${Date.now()}`);
  try {
    execSync(`vercel env pull ${path} --environment=${env} --yes 2>/dev/null`, { stdio: 'pipe' });
    return path;
  } catch (e) {
    console.error(`FAIL: could not pull ${env} env: ${e.message}`);
    return null;
  }
}

function parseEnv(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, 'utf-8');
  const out = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (!match) continue;
    let value = match[2];
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

function checkValue(name, value, spec) {
  const issues = [];

  if (value === undefined) {
    issues.push('MISSING');
    return issues;
  }

  if (value.length === 0) {
    issues.push('EMPTY');
    return issues;
  }

  // Literal \n (two chars: backslash + n) — the Anthropic bug from Phase 3
  if (value.endsWith('\\n')) {
    issues.push(`LITERAL_BACKSLASH_N at end (stored length ${value.length}, trim to ${value.length - 2})`);
  }

  // Actual trailing whitespace — the GITHUB_TOKEN bug from pre-build
  if (value !== value.trimEnd()) {
    issues.push('TRAILING_WHITESPACE');
  }

  // Leading whitespace (rare but possible)
  if (value !== value.trimStart()) {
    issues.push('LEADING_WHITESPACE');
  }

  // Length check against expected format
  if (spec.expectLength && value.length !== spec.expectLength) {
    issues.push(`LENGTH ${value.length} (expected ${spec.expectLength})`);
  }

  // Prefix check for known key formats
  if (spec.prefix && !value.startsWith(spec.prefix)) {
    issues.push(`PREFIX expected "${spec.prefix}"`);
  }

  return issues;
}

function main() {
  console.log('\nTheGrind env var verification\n');

  const envs = {};
  for (const env of ENVIRONMENTS) {
    const path = pull(env);
    if (!path) {
      console.error(`  skip  ${env} — pull failed`);
      continue;
    }
    envs[env] = parseEnv(path);
    try { unlinkSync(path); } catch {}
  }

  let failCount = 0;
  const results = [];

  for (const spec of SECRETS) {
    for (const env of ENVIRONMENTS) {
      if (!envs[env]) continue;
      const value = envs[env][spec.name];
      const issues = checkValue(spec.name, value, spec);

      if (issues.length === 0) {
        results.push(`  OK    ${env.padEnd(11)} ${spec.name.padEnd(25)} len=${value.length}`);
      } else {
        failCount++;
        results.push(`  FAIL  ${env.padEnd(11)} ${spec.name.padEnd(25)} ${issues.join(', ')}`);
      }
    }
  }

  // Cross-environment consistency check for paired tokens
  if (envs.preview) {
    const vite = envs.preview.VITE_CHIEF_AUTH_TOKEN;
    const chief = envs.preview.CHIEF_AUTH_TOKEN;
    if (vite && chief && vite !== chief) {
      failCount++;
      results.push(`  FAIL  preview     CHIEF_AUTH_TOKEN !== VITE_CHIEF_AUTH_TOKEN (auth will break)`);
    } else if (vite && chief) {
      results.push(`  OK    preview     CHIEF_AUTH_TOKEN == VITE_CHIEF_AUTH_TOKEN`);
    }
  }

  if (envs.production) {
    const vite = envs.production.VITE_CHIEF_AUTH_TOKEN;
    const chief = envs.production.CHIEF_AUTH_TOKEN;
    if (vite && chief && vite !== chief) {
      failCount++;
      results.push(`  FAIL  production  CHIEF_AUTH_TOKEN !== VITE_CHIEF_AUTH_TOKEN (auth will break)`);
    } else if (vite && chief) {
      results.push(`  OK    production  CHIEF_AUTH_TOKEN == VITE_CHIEF_AUTH_TOKEN`);
    }
  }

  console.log(results.join('\n'));
  console.log('');

  if (failCount > 0) {
    console.error(`${failCount} issue(s) detected. Fix before deploying.`);
    process.exit(1);
  } else {
    console.log('All env vars clean.');
    process.exit(0);
  }
}

main();
