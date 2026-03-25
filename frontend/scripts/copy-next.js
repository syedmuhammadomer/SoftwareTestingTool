#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '..');
const frontendNextDir = path.join(frontendDir, 'next');
const rootNextDir = path.resolve(frontendDir, '..', 'next');

if (!fs.existsSync(frontendNextDir)) {
  console.error(`[copy-next] expected Next build folder at ${frontendNextDir} but it does not exist.`);
  process.exitCode = 1;
  return;
}

fs.rmSync(rootNextDir, { recursive: true, force: true });
fs.cpSync(frontendNextDir, rootNextDir, { recursive: true, force: true });

console.log(`[copy-next] synced ${frontendNextDir} -> ${rootNextDir}`);
