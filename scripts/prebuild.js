const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[prebuild] Preparing clean build environment for DeskFlow...');

// 1. Detect and stop any running DeskFlow or Electron processes to release file locks
if (process.platform === 'win32') {
  const processesToKill = ['DeskFlow.exe', 'electron.exe'];
  for (const procName of processesToKill) {
    try {
      execSync(`taskkill /F /IM "${procName}" /T`, { stdio: 'pipe' });
      console.log(`[prebuild] Stopped running instance of ${procName} to release locked files.`);
    } catch {
      // Process was not running, normal
    }
  }

  // Small delay to allow Windows to completely release filesystem locks
  const waitUntil = Date.now() + 1200;
  while (Date.now() < waitUntil) {}
}

// 2. Safe directory cleaning with retry logic
function cleanDir(dirPath, label) {
  if (!fs.existsSync(dirPath)) return;

  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`[prebuild] Cleaned ${label} (${dirPath}).`);
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        console.warn(`[prebuild] Warning: Could not completely remove ${label}: ${err.message}`);
      } else {
        const wait = Date.now() + 800;
        while (Date.now() < wait) {}
      }
    }
  }
}

const rootDir = path.resolve(__dirname, '..');
const winUnpackedDir = path.join(rootDir, 'release', 'win-unpacked');
const distDir = path.join(rootDir, 'dist');

cleanDir(winUnpackedDir, 'release/win-unpacked');
cleanDir(distDir, 'dist');

console.log('[prebuild] Build environment is clean and ready.');
