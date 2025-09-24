#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import inquirer from 'inquirer';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import { execSync } from 'child_process';
import ora from 'ora';
import { expandHomeDir, isGitRepo, validateMaxDepth, getExecuteCommand, validateConfig } from './src/utils.mjs';
import { RepoCache } from './src/cache.mjs';

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
  maxDepth  Maximum search depth 1-10 (default: 3)
  command   Command to execute in selected repo (default: "code .")

Options:
  --init     Create configuration file
  --cleanup  Remove configuration file
  --help     Show this help

Examples:
  lcode                                    # Search current directory
  lcode ~ 5                               # Search home directory, depth 5
  lcode ~/projects 3 "code ."             # Custom path and command
  lcode ~ 5 ". ~/.nvm/nvm.sh && nvm use && code ."  # With NVM setup
  `);
  process.exit(0);
}

// Check if the program is called with --init
if (process.argv.includes('--init')) {
  const defaultConfig = {
    path: '~',
    maxDepth: 5,
    execute: 'code .',
    execute2: 'zsh',
    execute3: '[ -f .nvmrc ] && . ~/.nvm/nvm.sh && nvm use; code .',
  };
  try {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`✓ Configuration file created at ${configPath}`);
    console.log(JSON.stringify(defaultConfig, null, 2));
  } catch (error) {
    console.error(`✗ Failed to create config file: ${error.message}`);
    process.exit(1);
  }
  process.exit(0);
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
}

const BASE_DIR = path.resolve(process.argv[2] || expandHomeDir(config.path) || '.');
const MAX_DEPTH = validateMaxDepth(process.argv[3], config.maxDepth);
const EXECUTE = getExecuteCommand(process.argv, config);

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

    const choices = gitRepos.map((repo) => ({
      name: path.relative(BASE_DIR, repo) || path.basename(repo),
      value: repo,
    }));

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

main();
