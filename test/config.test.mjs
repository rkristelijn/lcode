import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { configExists } from '../src/config.mjs';

const testConfigPath = path.join(process.cwd(), '.test-lcodeconfig');
const originalHome = process.env.HOME;

describe('Config Module', () => {
  beforeEach(() => {
    // Set test home directory
    process.env.HOME = process.cwd();
    
    // Clean up any existing test config
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  afterEach(() => {
    // Restore original HOME
    process.env.HOME = originalHome;
    
    // Clean up test config
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  test('configExists returns false when no config file exists', () => {
    assert.strictEqual(configExists(), false);
  });

  test('configExists returns true when config file exists', () => {
    const configPath = path.resolve(process.env.HOME, '.lcodeconfig');
    fs.writeFileSync(configPath, '{}');
    
    try {
      assert.strictEqual(configExists(), true);
    } finally {
      fs.unlinkSync(configPath);
    }
  });

  test('config templates are properly structured', async () => {
    // Import the templates directly for testing
    const { CONFIG_TEMPLATES } = await import('../src/config.mjs');
    
    // Check that all templates have required properties
    Object.values(CONFIG_TEMPLATES).forEach(template => {
      assert(template.name, 'Template should have a name');
      assert(template.config, 'Template should have a config');
      assert(template.config.path, 'Config should have a path');
      assert(template.config.maxDepth, 'Config should have maxDepth');
      assert(template.config.execute, 'Config should have execute command');
    });
  });
});
