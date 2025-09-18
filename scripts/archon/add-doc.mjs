#!/usr/bin/env node
// Minimal script to add a local Markdown file as an Archon Document via API.
// Uses Node 18+ built-in fetch; no external deps.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project' || a === '-p') args.project = argv[++i];
    else if (a === '--file' || a === '-f') args.file = argv[++i];
    else if (a === '--type' || a === '-t') args.type = argv[++i];
    else if (a === '--host') args.host = argv[++i];
    else if (a === '--port') args.port = argv[++i];
    else if (a === '--dry-run') args.dryRun = true;
  }
  return args;
}

function env(name, fallback) {
  return process.env[name] && process.env[name].trim() !== ''
    ? process.env[name]
    : fallback;
}

async function main() {
  const args = parseArgs(process.argv);
  const projectId = args.project || process.env.ARCHON_PROJECT_ID;
  const mdPath = args.file || 'doc-neynerlll.md';
  const documentType = args.type || 'guide';
  const host = args.host || env('HOST', 'localhost');
  const port = Number(args.port || env('ARCHON_SERVER_PORT', '8181'));

  if (!projectId) {
    console.error('Error: --project <uuid> or ARCHON_PROJECT_ID is required');
    process.exit(1);
  }

  const absPath = path.isAbsolute(mdPath) ? mdPath : path.resolve(process.cwd(), mdPath);
  const exists = await fs
    .access(absPath)
    .then(() => true)
    .catch(() => false);
  if (!exists) {
    console.error(`Error: file not found: ${absPath}`);
    process.exit(1);
  }

  const raw = await fs.readFile(absPath, 'utf8');
  const firstLine = raw.split(/\r?\n/)[0] || '';
  const inferredTitle = (firstLine.startsWith('#') ? firstLine.replace(/^#+\s*/, '') : path.basename(mdPath))
    .replace(/\r/g, '')
    .trim();

  const payload = {
    document_type: documentType,
    title: inferredTitle || 'Imported Document',
    content: {
      format: 'markdown',
      path: path.relative(process.cwd(), absPath),
      size_bytes: Buffer.byteLength(raw, 'utf8'),
      checksum_sha1: await sha1(raw),
      text: raw,
    },
    tags: ['neynar', 'docs'],
    author: process.env.USER || process.env.USERNAME || 'local-user',
  };

  if (args.dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const url = `http://${host}:${port}/api/projects/${encodeURIComponent(projectId)}/docs`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`Request failed: ${res.status} ${res.statusText}`);
    console.error(text);
    process.exit(1);
  }
  try {
    const json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2));
  } catch {
    console.log(text);
  }
}

async function sha1(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-1', data);
  return Buffer.from(digest).toString('hex');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

