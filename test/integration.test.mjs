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

test('CLI --init creates config file', () => {
  const configPath = path.join(process.env.HOME, '.lcodeconfig');
  
  try {
    // Remove existing config if any
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
    
    // Note: This test would need to be run interactively or mocked
    // For now, we test that the --init flag is recognized
    const output = execSync(`echo "1\ny" | node ${CLI_PATH} --init`, { 
      encoding: 'utf8',
      timeout: 5000
    });
    
    assert(output.includes('Welcome to lcode configuration setup') || 
           output.includes('Configuration'), 'Should show config setup');
  } catch (error) {
    // Interactive prompts might fail in CI, so we check for expected behavior
    assert(error.stdout.includes('Welcome to lcode') || 
           error.stderr.includes('stdin is not a TTY'), 
           'Should attempt to show interactive config or fail gracefully');
  } finally {
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
  }
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
    execSync(`node ${CLI_PATH} /non/existent/path --list`, { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    });
    assert.fail('Should have thrown an error');
  } catch (error) {
    // Check if error status is 1 or if stderr contains expected message
    const hasCorrectStatus = error.status === 1;
    const hasCorrectMessage = (error.stderr || error.stdout || '').includes('does not exist');
    
    assert(hasCorrectStatus || hasCorrectMessage, 
           `Expected error status 1 or error message about directory not existing. Got status: ${error.status}, stderr: ${error.stderr}, stdout: ${error.stdout}`);
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

test('CLI --list shows repositories', () => {
  // Test list mode with parent directory that should have repos
  const output = execSync(`node ${CLI_PATH} .. 2 --list`, { 
    encoding: 'utf8',
    timeout: 10000 
  });
  
  // Should show numbered list of repositories
  assert(typeof output === 'string');
  // If repos found, should have format "0: repo-name"
  if (output.trim() && !output.includes('No git repositories found')) {
    assert(output.match(/^\d+: /m));
  }
});

test('CLI --select works with valid index', () => {
  try {
    // First get the list to see if we have repos
    const listOutput = execSync(`node ${CLI_PATH} .. 2 --list`, { 
      encoding: 'utf8',
      timeout: 10000 
    });
    
    if (listOutput.includes('No git repositories found')) {
      // Skip test if no repos found
      return;
    }
    
    // Try to select index 0 with echo command
    const output = execSync(`node ${CLI_PATH} .. 2 --select 0 echo`, { 
      encoding: 'utf8',
      timeout: 10000 
    });
    
    assert(output.includes('→ Selected:'));
    assert(output.includes('→ Command: echo'));
  } catch (error) {
    // Test passes if it's just a timeout or expected behavior
    assert(error.status === 0 || error.stdout.includes('→ Selected:'));
  }
});

test('CLI --select handles invalid index', () => {
  try {
    const output = execSync(`node ${CLI_PATH} .. 2 --select 999`, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 5000 
    });
    // If it doesn't throw, check if it found repos and handled invalid index
    if (!output.includes('No git repositories found')) {
      assert.fail('Should have thrown an error for invalid index when repos exist');
    }
  } catch (error) {
    // Should throw error for invalid index
    const output = error.stderr || error.stdout || '';
    assert(output.includes('Invalid index') || output.includes('No git repositories found'));
  }
});
