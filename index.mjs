#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import { execSync } from 'child_process';
import ora from 'ora';
import { expandHomeDir, isGitRepo, validateMaxDepth, getExecuteCommand, validateConfig, getReadmePreview, detectLanguages } from './src/utils.mjs';
import { RepoCache } from './src/cache.mjs';
import { createInteractiveConfig } from './src/config.mjs';

// Register the autocomplete prompt
inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

// Get the directory from the first argument or default to the current directory

// Path to the configuration file
const configPath = path.resolve(process.env.HOME, '.lcodeconfig');
const cache = new RepoCache();

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
lcode - A CLI tool to search your git repos and open them

Usage: lcode [path] [maxDepth] [command]

Arguments:
  path      Starting directory to search (default: current directory)
  maxDepth  Maximum search depth 1-10 (default: 5)
  command   Command to execute in selected repo (default: "code .")

Options:
  --init     Create configuration file (interactive)
  --cleanup  Remove configuration file
  --list     List all repositories (non-interactive)
  --select N Select repository by index (0-based)
  --lang L   Filter by language (js, ts, python, java, kotlin, go, rust, ruby, php, nx, other)
             Can specify multiple: --lang ts,js or --lang java,kotlin
  --help     Show this help

Examples:
  lcode                                    # Interactive mode
  lcode --list                            # List all repos
  lcode --list --lang ts                  # List only TypeScript repos
  lcode --list --lang ts,js               # List TypeScript or JavaScript repos
  lcode --list --lang java,kotlin         # List Java or Kotlin repos
  lcode --select 0                        # Select first repo
  lcode ~ 5 --list                        # List repos from ~ with depth 5
  lcode ~ 5 --select 2 "code ."           # Select 3rd repo and open in VS Code
  `);
  process.exit(0);
}

// Main async function to handle top-level await
(async () => {
  // Check if the program is called with --init
  if (process.argv.includes('--init')) {
    const success = await createInteractiveConfig();
    process.exit(success ? 0 : 1);
  }

// Check if the program is called with --cleanup
if (process.argv.includes('--cleanup')) {
  try {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
      cache.clear();
      console.log(`✓ Configuration file and cache removed`);
    } else {
      console.log(`No configuration file found at ${configPath}`);
    }
  } catch (error) {
    console.error(`✗ Failed to cleanup: ${error.message}`);
    process.exit(1);
  }
  process.exit(0);
}

// Load configuration
let config = {};
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // Validate config structure
    const errors = validateConfig(config);
    if (errors.length > 0) {
      console.error(`✗ Invalid configuration: ${errors.join(', ')}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`✗ Invalid configuration file: ${error.message}`);
    process.exit(1);
  }
} else {
  // No config exists - prompt user to create one (only in interactive mode)
  const isNonInteractive = process.argv.includes('--list') || 
                           process.argv.includes('--select') ||
                           !process.stdin.isTTY;
  
  if (!isNonInteractive) {
    console.log('🔧 No configuration found. Let\'s set one up!');
    
    const shouldCreate = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'create',
        message: 'Would you like to create a configuration file?',
        default: true
      }
    ]);
    
    if (shouldCreate.create) {
      const success = await createInteractiveConfig();
      if (success) {
        // Reload the config
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
    } else {
      console.log('Continuing with default settings...');
    }
  }
}

// Parse arguments properly
const selectIndex = process.argv.findIndex(arg => arg === '--select');
const selectValue = selectIndex !== -1 ? process.argv[selectIndex + 1] : null;

const langIndex = process.argv.findIndex(arg => arg === '--lang');
const langFilterRaw = langIndex !== -1 ? process.argv[langIndex + 1] : null;
const langFilters = langFilterRaw ? langFilterRaw.split(',').map(l => l.trim()) : null;

// Filter out --select, --lang and their values for normal arg parsing
const filteredArgs = process.argv.slice(2).filter((arg, index, arr) => {
  if (arg === '--select') return false;
  if (index > 0 && arr[index - 1] === '--select') return false;
  if (arg === '--lang') return false;
  if (index > 0 && arr[index - 1] === '--lang') return false;
  if (arg === '--list') return false;
  return true;
});

const BASE_DIR = path.resolve(filteredArgs[0] || expandHomeDir(config.path) || '.');
const MAX_DEPTH = validateMaxDepth(filteredArgs[1], config.maxDepth);
const EXECUTE = filteredArgs[2] || getExecuteCommand(process.argv, config);

// Recursively scan for directories containing a .git folder
const getGitRepos = (baseDir, maxDepth) => {
  const spinner = ora('Scanning for git repositories...').start();
  
  try {
    const allDirs = glob.sync('**/*/', {
      cwd: baseDir,
      ignore: [
        '**/node_modules/**',
        '**/Applications/**',
        '**/Desktop/**',
        '**/Downloads/**',
        '**/Library/**',
        '**/Movies/**',
        '**/Music/**',
        '**/Pictures/**',
        '**/Public/**',
        '**/.git/**',
        '**/build/**',
        '**/dist/**',
        '**/.next/**',
      ],
      maxDepth: maxDepth,
    });
    
    const gitRepos = allDirs
      .map((dir) => path.join(baseDir, dir))
      .filter(isGitRepo);
    
    spinner.succeed(`Found ${gitRepos.length} git repositories`);
    return gitRepos;
  } catch (error) {
    spinner.fail(`Error scanning directories: ${error.message}`);
    throw error;
  }
};

// Get repos with caching
const getCachedRepos = (baseDir, maxDepth) => {
  const cached = cache.get(baseDir, maxDepth);
  if (cached) {
    console.log(`Using cached results (${cached.length} repositories)`);
    return cached;
  }
  
  const repos = getGitRepos(baseDir, maxDepth);
  cache.set(baseDir, maxDepth, repos);
  return repos;
};

// Main function to list repos and allow selection
const main = async () => {
  try {
    // Check if the base directory exists and is accessible
    if (!fs.existsSync(BASE_DIR)) {
      console.error(`✗ Directory "${BASE_DIR}" does not exist.`);
      process.exit(1);
    }

    try {
      fs.accessSync(BASE_DIR, fs.constants.R_OK);
    } catch {
      console.error(`✗ Directory "${BASE_DIR}" is not accessible.`);
      process.exit(1);
    }

    const gitRepos = getCachedRepos(BASE_DIR, MAX_DEPTH);

    if (gitRepos.length === 0) {
      console.log('No git repositories found.');
      return;
    }

    // Filter by language if specified
    let filteredRepos = gitRepos;
    if (langFilters) {
      filteredRepos = gitRepos.filter(repo => {
        const repoLangs = detectLanguages(repo);
        return langFilters.some(filter => repoLangs.includes(filter));
      });
      if (filteredRepos.length === 0) {
        console.log(`No repositories found with language(s): ${langFilters.join(', ')}`);
        return;
      }
      console.log(`Filtered to ${filteredRepos.length} repositories with language(s): ${langFilters.join(', ')}`);
    }

    // Non-interactive modes
    if (process.argv.includes('--list')) {
      filteredRepos.forEach((repo, index) => {
        const relativePath = path.relative(BASE_DIR, repo) || path.basename(repo);
        const langs = detectLanguages(repo);
        const langDisplay = langs.join(',');
        const preview = getReadmePreview(repo, config.previewLength || 80);
        const display = preview ? `${relativePath} [${langDisplay}] - ${preview}` : `${relativePath} [${langDisplay}]`;
        console.log(`${index}: ${display}`);
      });
      return;
    }

    if (selectValue) {
      const index = parseInt(selectValue, 10);
      if (isNaN(index) || index < 0 || index >= filteredRepos.length) {
        console.error(`✗ Invalid index ${index}. Available: 0-${filteredRepos.length - 1}`);
        process.exit(1);
      }
      
      const selectedRepo = filteredRepos[index];
      const relativePath = path.relative(BASE_DIR, selectedRepo) || path.basename(selectedRepo);
      
      console.log(`→ Selected: ${relativePath}`);
      console.log(`→ Command: ${EXECUTE}\n`);

      execSync(`cd "${selectedRepo}" && ${EXECUTE}`, { 
        stdio: 'inherit', 
        shell: '/bin/bash' 
      });
      return;
    }

    // Interactive mode
    const choices = filteredRepos.map((repo) => {
      const name = path.relative(BASE_DIR, repo) || path.basename(repo);
      const langs = detectLanguages(repo);
      const langDisplay = langs.join(',');
      const preview = getReadmePreview(repo, config.previewLength || 80);
      return {
        name: preview ? `${name} [${langDisplay}] - ${preview}` : `${name} [${langDisplay}]`,
        value: repo,
      };
    });

    const answer = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'repo',
        message: 'Select a git repository:',
        source: (answersSoFar, input) => {
          input = input || '';
          return new Promise((resolve) => {
            const filtered = choices.filter((choice) => 
              choice.name.toLowerCase().includes(input.toLowerCase())
            );
            resolve(filtered);
          });
        },
      },
    ]);

    console.log(`\n→ Opening: ${path.relative(BASE_DIR, answer.repo) || path.basename(answer.repo)}`);
    console.log(`→ Command: ${EXECUTE}\n`);

    execSync(`cd "${answer.repo}" && ${EXECUTE}`, { 
      stdio: 'inherit', 
      shell: '/bin/bash' 
    });

  } catch (error) {
    if (error.isTtyError) {
      console.error('✗ Prompt couldn\'t be rendered in the current environment');
    } else if (error.message.includes('User force closed the prompt')) {
      console.log('\nOperation cancelled.');
    } else {
      console.error('✗ An error occurred:', error.message);
    }
    process.exit(1);
  }
};

await main();
})();
