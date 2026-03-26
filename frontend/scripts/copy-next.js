#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '..');
const rootNextDir = path.resolve(frontendDir, '..', 'next');
const candidateDirs = ['next', '.next'];
const frontendNextDir = candidateDirs
  .map((dir) => ({ dir, path: path.join(frontendDir, dir) }))
  .find(({ path: candidate }) => fs.existsSync(candidate));

if (!frontendNextDir) {
  console.error(
    `[copy-next] expected Next build folder (${candidateDirs.join(' or ')}) under ${frontendDir}, but nothing was found.`,
  );
  process.exitCode = 1;
  return;
}

fs.rmSync(rootNextDir, { recursive: true, force: true });
fs.cpSync(frontendNextDir.path, rootNextDir, { recursive: true, force: true });

console.log(`[copy-next] synced ${frontendNextDir.path} -> ${rootNextDir}`);
