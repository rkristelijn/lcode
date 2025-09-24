import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';

// Function to expand ~ to the home directory
export const expandHomeDir = (dir) => {
  if (dir?.startsWith('~')) {
    return path.join(process.env.HOME, dir.slice(1));
  }
  return dir;
};

// Function to check if a folder is a git repo (sync version for compatibility)
export const isGitRepo = (folderPath) => {
  return fs.existsSync(path.join(folderPath, '.git'));
};

// Async version for better performance
export const isGitRepoAsync = async (folderPath) => {
  try {
    await fsPromises.access(path.join(folderPath, '.git'));
    return true;
  } catch {
    return false;
  }
};

// Validate and sanitize maxDepth
export const validateMaxDepth = (depth, defaultDepth = 3) => {
  const parsed = parseInt(depth, 10);
  if (isNaN(parsed)) return defaultDepth;
  return Math.max(1, Math.min(parsed, 10));
};

// Get execute command from config and args
export const getExecuteCommand = (args, config) => {
  if (args[4]) return args[4];
  
  const commands = [config.execute, config.execute2, config.execute3].filter(Boolean);
  return commands[0] || 'code .';
};

// Get README preview for repository
export const getReadmePreview = (repoPath) => {
  const readmeFiles = ['README.md', 'readme.md', 'README.txt', 'readme.txt'];
  
  for (const filename of readmeFiles) {
    const readmePath = path.join(repoPath, filename);
    try {
      if (fs.existsSync(readmePath)) {
        const content = fs.readFileSync(readmePath, 'utf8');
        const lines = content.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .filter(line => !line.startsWith('<!--'))  // Skip HTML comments
          .filter(line => !line.startsWith('[!['))   // Skip badge lines
          .filter(line => !line.startsWith('<'))     // Skip HTML tags
          .filter(line => !line.match(/^#+\s*$/));   // Skip empty headers
        
        if (lines.length === 0) continue;
        
        // Get first meaningful line, remove markdown headers
        let firstLine = lines[0].replace(/^#+\s*/, '').trim();
        const repoName = path.basename(repoPath);
        
        // Skip if it's just the project name (same as repo name), try next line
        if (firstLine.toLowerCase() === repoName.toLowerCase() && lines.length > 1) {
          firstLine = lines[1].replace(/^#+\s*/, '').trim();
        }
        
        if (!firstLine) continue;
        
        return firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;
      }
    } catch {
      // Ignore errors and continue
    }
  }
  return null;
};

// Validate config file structure
export const validateConfig = (config) => {
  const errors = [];
  
  if (config.path && typeof config.path !== 'string') {
    errors.push('path must be a string');
  }
  
  if (config.maxDepth !== undefined) {
    const depth = parseInt(config.maxDepth, 10);
    if (isNaN(depth) || depth < 1 || depth > 10) {
      errors.push('maxDepth must be a number between 1 and 10');
    }
  }
  
  ['execute', 'execute2', 'execute3'].forEach(key => {
    if (config[key] && typeof config[key] !== 'string') {
      errors.push(`${key} must be a string`);
    }
  });
  
  return errors;
};
