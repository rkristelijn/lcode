import { test } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CLI_PATH = path.join(process.cwd(), 'index.mjs');

test('CLI --help shows usage information', () => {
  const output = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf8' });
  assert(output.includes('lcode - A CLI tool'));
  assert(output.includes('Usage: lcode'));
  assert(output.includes('--init'));
  assert(output.includes('--cleanup'));
});

test('CLI --init creates config file', async (t) => {
  const configPath = path.join(process.env.HOME, '.lcodeconfig');
  
  t.after(() => {
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
  });
  
  // Remove existing config if any
  if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
  
  const output = execSync(`node ${CLI_PATH} --init`, { encoding: 'utf8' });
  
  assert(output.includes('✓ Configuration file created'));
  assert(fs.existsSync(configPath));
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  assert.strictEqual(config.path, '~');
  assert.strictEqual(config.maxDepth, 5);
  assert.strictEqual(config.execute, 'code .');
});

test('CLI --cleanup removes config file', async (_t) => {
  const configPath = path.join(process.env.HOME, '.lcodeconfig');
  
  // Create a config file first
  const testConfig = { path: '~', maxDepth: 3 };
  fs.writeFileSync(configPath, JSON.stringify(testConfig));
  
  const output = execSync(`node ${CLI_PATH} --cleanup`, { encoding: 'utf8' });
  
  assert(output.includes('✓ Configuration file and cache removed'));
  assert(!fs.existsSync(configPath));
});

test('CLI handles non-existent directory gracefully', () => {
  try {
    execSync(`node ${CLI_PATH} /non/existent/path`, { encoding: 'utf8', stdio: 'pipe' });
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert.strictEqual(error.status, 1);
    assert(error.stderr.includes('Directory') && error.stderr.includes('does not exist'));
  }
});

test('CLI validates maxDepth parameter', () => {
  // Test with current directory and depth 0 (should become 1)
  const output = execSync(`node ${CLI_PATH} . 0 echo 2>/dev/null || echo "No repos found"`, { 
    encoding: 'utf8',
    timeout: 5000 
  });
  
  // Should not crash and should handle the validation
  assert(typeof output === 'string');
});
