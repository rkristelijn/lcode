#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';
import inquirerAutocompletePrompt from 'inquirer-autocomplete-prompt';
import { execSync } from 'child_process';

// Register the autocomplete prompt
inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt);

// Get the directory from the first argument or default to the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the configuration file
const configPath = path.resolve(process.env.HOME, '.lcodeconfig');

// Check if the program is called with --init
if (process.argv.includes('--init')) {
  const defaultConfig = {
    path: '~',
    maxDepth: 5,
    execute: 'code .',
    execute2: 'zsh',
    execute3: '. ~/.nvm/nvm.sh && nvm use && code .',
  };
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  console.log(`Configuration file created at ${configPath}:`);
  console.log(`${JSON.stringify(defaultConfig, null, 2)}`);
  process.exit(0);
}

// Check if the program is called with --cleanup
if (process.argv.includes('--cleanup')) {
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
    console.log(`Configuration file at ${configPath} has been removed.`);
  } else {
    console.log(`No configuration file found at ${configPath}.`);
  }
  process.exit(0);
}

console.log(configPath);
let config = {};
if (fs.existsSync(configPath)) {
  console.log('Loading configuration from .lcodeconfig');
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log(config);
}

// Function to expand ~ to the home directory
const expandHomeDir = (dir) => {
  if (dir?.startsWith('~')) {
    return path.join(process.env.HOME, dir.slice(1));
  }
  return dir;
};

const BASE_DIR = path.resolve(process.argv[2] || expandHomeDir(config.path) || '.');
const MAX_DEPTH = parseInt(process.argv[3], 10) || config.maxDepth || 3;
const EXECUTE = process.argv[4] || config.execute || 'code .';

// Function to check if a folder is a git repo
const isGitRepo = (folderPath) => {
  return fs.existsSync(path.join(folderPath, '.git'));
};

// Recursively scan for directories containing a .git folder, up to maxDepth levels deep and ignoring node_modules and default macOS directories
const getGitRepos = (baseDir, maxDepth) => {
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
    ],
    maxDepth: maxDepth,
  });
  const gitRepos = allDirs.map((dir) => path.join(baseDir, dir)).filter(isGitRepo);
  return gitRepos;
};

// Main function to list repos and allow selection
const main = async () => {
  // Check if the base directory exists
  if (!fs.existsSync(BASE_DIR)) {
    console.log(`Directory "${BASE_DIR}" does not exist.`);
    return;
  }

  const gitRepos = getGitRepos(BASE_DIR, MAX_DEPTH);

  if (gitRepos.length === 0) {
    console.log('No git repositories found.');
    return;
  }

  const choices = gitRepos.map((repo) => ({
    name: path.relative(BASE_DIR, repo),
    value: repo,
  }));

  try {
    const answer = await inquirer.prompt([
      {
        type: 'autocomplete',
        name: 'repo',
        message: 'Select a git repository:',
        source: (answersSoFar, input) => {
          input = input || '';
          return new Promise((resolve) => {
            const filtered = choices.filter((choice) => choice.name.toLowerCase().includes(input.toLowerCase()));
            resolve(filtered);
          });
        },
        filter: (val) => {
          // Transform the selected value if needed
          return path.resolve(BASE_DIR, val);
        },
      },
    ]);

    // Output only the selected directory path
    console.log(`You selected: ${answer.repo}`);

    execSync(`cd ${answer.repo} && ${EXECUTE}`, { stdio: 'inherit', shell: '/bin/bash' });
  } catch (error) {
    if (error.isTtyError) {
      console.error("Prompt couldn't be rendered in the current environment");
    } else if (error.message.includes('User force closed the prompt')) {
      console.error('Prompt was closed. Exiting...');
    } else {
      console.error('An error occurred:', error);
    }
    process.exit(1); // Ensure the script exits with an error code
  }
};

main();
