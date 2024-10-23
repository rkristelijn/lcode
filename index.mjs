#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';

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

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'repo',
      message: 'Select a git repository:',
      choices: choices,
    },
  ]);

  console.log(`You selected: ${answer.repo}`);
};

main();
