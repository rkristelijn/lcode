#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { expandHomeDir, isGitRepo, detectLanguages, getReadmePreview } from './src/utils.mjs';
import { RepoCache } from './src/cache.mjs';

const cache = new RepoCache();
const configPath = path.resolve(process.env.HOME, '.lcodeconfig');

const getConfig = () => {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch {}
  return { path: '~', maxDepth: 5 };
};

const findRepos = async (searchPath, maxDepth, langFilter = null) => {
  const expanded = expandHomeDir(searchPath);
  const cacheKey = `${expanded}-${maxDepth}`;
  
  let repos = cache.get(cacheKey);
  if (!repos) {
    const pattern = `${expanded}/${'*/'.repeat(maxDepth - 1)}`;
    const folders = await glob(pattern, { 
      ignore: ['**/node_modules/**', '**/build/**', '**/dist/**', '**/.git/**'],
      absolute: true 
    });
    
    repos = folders
      .filter(isGitRepo)
      .map(repoPath => ({
        path: repoPath,
        name: path.basename(repoPath),
        languages: detectLanguages(repoPath),
        description: getReadmePreview(repoPath)
      }));
    
    cache.set(cacheKey, repos);
  }
  
  if (langFilter) {
    const filters = langFilter.split(',').map(l => l.trim().toLowerCase());
    repos = repos.filter(r => r.languages.some(l => filters.includes(l.toLowerCase())));
  }
  
  return repos;
};

const server = new Server(
  { name: 'lcode', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_repos',
      description: 'List all git repositories in a directory with language detection',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory to search (default: from config)' },
          maxDepth: { type: 'number', description: 'Search depth 1-10 (default: from config)' },
          language: { type: 'string', description: 'Filter by language (comma-separated: ts,js,python,etc)' }
        }
      }
    },
    {
      name: 'select_repo',
      description: 'Get details about a specific repository by index or name',
      inputSchema: {
        type: 'object',
        properties: {
          index: { type: 'number', description: 'Repository index from list_repos' },
          name: { type: 'string', description: 'Repository name' },
          path: { type: 'string', description: 'Search path (default: from config)' },
          maxDepth: { type: 'number', description: 'Search depth (default: from config)' }
        }
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const config = getConfig();
  
  if (name === 'list_repos') {
    const searchPath = args.path || config.path || '~';
    const maxDepth = args.maxDepth || config.maxDepth || 5;
    const repos = await findRepos(searchPath, maxDepth, args.language);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(repos.map((r, i) => ({
          index: i,
          name: r.name,
          path: r.path,
          languages: r.languages,
          description: r.description
        })), null, 2)
      }]
    };
  }
  
  if (name === 'select_repo') {
    const searchPath = args.path || config.path || '~';
    const maxDepth = args.maxDepth || config.maxDepth || 5;
    const repos = await findRepos(searchPath, maxDepth);
    
    let repo;
    if (args.index !== undefined) {
      repo = repos[args.index];
    } else if (args.name) {
      repo = repos.find(r => r.name === args.name);
    }
    
    if (!repo) {
      return { content: [{ type: 'text', text: 'Repository not found' }], isError: true };
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(repo, null, 2)
      }]
    };
  }
  
  return { content: [{ type: 'text', text: 'Unknown tool' }], isError: true };
});

const transport = new StdioServerTransport();
await server.connect(transport);
