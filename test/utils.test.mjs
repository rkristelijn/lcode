import { test } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import fs from 'fs';
import { expandHomeDir, isGitRepo, validateMaxDepth, getExecuteCommand, validateConfig } from '../src/utils.mjs';

test('expandHomeDir - expands ~ correctly', () => {
  const result = expandHomeDir('~/test');
  const expected = path.join(process.env.HOME, 'test');
  assert.strictEqual(result, expected);
});

test('expandHomeDir - returns unchanged path without ~', () => {
  const result = expandHomeDir('/absolute/path');
  assert.strictEqual(result, '/absolute/path');
});

test('expandHomeDir - handles null/undefined', () => {
  assert.strictEqual(expandHomeDir(null), null);
  assert.strictEqual(expandHomeDir(undefined), undefined);
});

test('validateMaxDepth - validates numeric input', () => {
  assert.strictEqual(validateMaxDepth('5'), 5);
  assert.strictEqual(validateMaxDepth('0'), 1); // minimum is 1
  assert.strictEqual(validateMaxDepth('15'), 10); // maximum is 10
  assert.strictEqual(validateMaxDepth('invalid'), 3); // default
  assert.strictEqual(validateMaxDepth(null, 7), 7); // custom default
});

test('getExecuteCommand - prioritizes command line arg', () => {
  const args = ['node', 'index.mjs', '~', '5', 'custom-command'];
  const config = { execute: 'code .', execute2: 'zsh' };
  assert.strictEqual(getExecuteCommand(args, config), 'custom-command');
});

test('getExecuteCommand - falls back to config', () => {
  const args = ['node', 'index.mjs'];
  const config = { execute: 'code .', execute2: 'zsh' };
  assert.strictEqual(getExecuteCommand(args, config), 'code .');
});

test('getExecuteCommand - uses default when no config', () => {
  const args = ['node', 'index.mjs'];
  const config = {};
  assert.strictEqual(getExecuteCommand(args, config), 'code .');
});

test('validateConfig - validates valid config', () => {
  const config = {
    path: '~',
    maxDepth: 5,
    execute: 'code .',
    execute2: 'zsh'
  };
  const errors = validateConfig(config);
  assert.strictEqual(errors.length, 0);
});

test('validateConfig - catches invalid path', () => {
  const config = { path: 123 };
  const errors = validateConfig(config);
  assert(errors.includes('path must be a string'));
});

test('validateConfig - catches invalid maxDepth', () => {
  const config = { maxDepth: 'invalid' };
  const errors = validateConfig(config);
  assert(errors.includes('maxDepth must be a number between 1 and 10'));
});

test('validateConfig - catches invalid execute commands', () => {
  const config = { execute: 123, execute2: true };
  const errors = validateConfig(config);
  assert(errors.includes('execute must be a string'));
  assert(errors.includes('execute2 must be a string'));
});

test('isGitRepo - detects git repository', async (t) => {
  // Create a temporary directory with .git folder
  const tempDir = path.join(process.cwd(), 'temp-test-repo');
  const gitDir = path.join(tempDir, '.git');
  
  t.after(() => {
    // Cleanup
    if (fs.existsSync(gitDir)) fs.rmSync(gitDir, { recursive: true });
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true });
  });
  
  fs.mkdirSync(tempDir, { recursive: true });
  fs.mkdirSync(gitDir);
  
  assert.strictEqual(isGitRepo(tempDir), true);
});

test('isGitRepo - returns false for non-git directory', () => {
  const tempDir = path.join(process.cwd(), 'temp-non-git');
  fs.mkdirSync(tempDir, { recursive: true });
  
  assert.strictEqual(isGitRepo(tempDir), false);
  
  // Cleanup
  fs.rmSync(tempDir, { recursive: true });
});
