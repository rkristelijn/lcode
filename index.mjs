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

// Get the directory from the first argument or default to ~/git
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(process.argv[2] || '.');

// Function to check if a folder is a git repo
const isGitRepo = (folderPath) => {
  return fs.existsSync(path.join(folderPath, '.git'));
};

// Recursively scan for directories containing a .git folder, up to 3 levels deep and ignoring node_modules
const getGitRepos = (baseDir) => {
  const allDirs = glob.sync('**/*/', {
    cwd: baseDir,
    ignore: '**/node_modules/**',
    maxDepth: 3,
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

  const gitRepos = getGitRepos(BASE_DIR);

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

    // Run a command in the selected directory
    const command = `cd ${answer.repo} && code .`; // Replace 'ls' with the command you want to run
    execSync(command, { stdio: 'inherit' });
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
