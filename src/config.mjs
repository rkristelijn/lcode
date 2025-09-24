import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

export const CONFIG_TEMPLATES = {
  basic: {
    name: 'Basic setup',
    config: {
      path: '~',
      maxDepth: 5,
      execute: 'code .',
      execute2: 'zsh',
      execute3: 'bash'
    }
  },
  nvm: {
    name: 'Node.js with NVM',
    config: {
      path: '~',
      maxDepth: 5,
      execute: '[ -f .nvmrc ] && . ~/.nvm/nvm.sh && nvm use; code .',
      execute2: '. ~/.nvm/nvm.sh && nvm use && npm start',
      execute3: 'nvm use && yarn dev'
    }
  },
  nix: {
    name: 'Nix development environment',
    config: {
      path: '~',
      maxDepth: 5,
      execute: 'nix develop -c code .',
      execute2: 'nix-shell --run "code ."',
      execute3: 'direnv allow && code .'
    }
  },
  mixed: {
    name: 'Mixed environments (auto-detect)',
    config: {
      path: '~',
      maxDepth: 5,
      execute: 'bash -c "if [ -f flake.nix ]; then nix develop; elif [ -f .nvmrc ]; then . ~/.nvm/nvm.sh && nvm use; fi; zsh"',
      execute2: 'code .',
      execute3: 'zsh'
    }
  },
  cursor: {
    name: 'Cursor editor',
    config: {
      path: '~',
      maxDepth: 5,
      execute: 'cursor .',
      execute2: 'zsh',
      execute3: 'bash'
    }
  }
};

export async function createInteractiveConfig() {
  // Detect CI environment and use basic setup
  const isCI = process.env.CI || process.env.GITHUB_ACTIONS || process.env.JENKINS_URL;
  
  if (isCI) {
    console.log('🤖 CI environment detected - using basic configuration');
    const basicConfig = CONFIG_TEMPLATES.basic.config;
    const configPath = path.resolve(process.env.HOME, '.lcodeconfig');
    
    try {
      fs.writeFileSync(configPath, JSON.stringify(basicConfig, null, 2));
      console.log(`✓ Configuration file created at ${configPath}`);
      return true;
    } catch (error) {
      console.error(`✗ Failed to create configuration file: ${error.message}`);
      return false;
    }
  }

  console.log('\n🚀 Welcome to lcode configuration setup!\n');

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Choose a configuration template:',
      choices: [
        { name: CONFIG_TEMPLATES.basic.name, value: 'basic' },
        { name: CONFIG_TEMPLATES.nvm.name, value: 'nvm' },
        { name: CONFIG_TEMPLATES.nix.name, value: 'nix' },
        { name: CONFIG_TEMPLATES.mixed.name, value: 'mixed' },
        { name: CONFIG_TEMPLATES.cursor.name, value: 'cursor' },
        { name: 'Custom setup', value: 'custom' }
      ]
    }
  ]);

  let config;

  if (answers.template === 'custom') {
    const customAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'path',
        message: 'Default search path:',
        default: '~'
      },
      {
        type: 'input',
        name: 'maxDepth',
        message: 'Default search depth (1-10):',
        default: '5',
        validate: (input) => {
          const num = parseInt(input, 10);
          if (isNaN(num) || num < 1 || num > 10) {
            return 'Please enter a number between 1 and 10';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'execute',
        message: 'Primary command:',
        default: 'code .'
      },
      {
        type: 'input',
        name: 'execute2',
        message: 'Alternative command:',
        default: 'zsh'
      },
      {
        type: 'input',
        name: 'execute3',
        message: 'Third command:',
        default: 'bash'
      }
    ]);

    config = {
      path: customAnswers.path,
      maxDepth: parseInt(customAnswers.maxDepth, 10),
      execute: customAnswers.execute,
      execute2: customAnswers.execute2,
      execute3: customAnswers.execute3
    };
  } else {
    config = { ...CONFIG_TEMPLATES[answers.template].config };
  }

  // Show preview and confirm
  console.log('\n📋 Configuration preview:');
  console.log(JSON.stringify(config, null, 2));

  const confirm = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'save',
      message: 'Save this configuration?',
      default: true
    }
  ]);

  if (confirm.save) {
    const dynamicConfigPath = path.resolve(process.env.HOME, '.lcodeconfig');
    try {
      fs.writeFileSync(dynamicConfigPath, JSON.stringify(config, null, 2));
      console.log(`\n✅ Configuration saved to ${dynamicConfigPath}`);
      return true;
    } catch (error) {
      console.error(`\n❌ Failed to save configuration: ${error.message}`);
      return false;
    }
  } else {
    console.log('\n❌ Configuration not saved');
    return false;
  }
}

export function configExists() {
  const dynamicConfigPath = path.resolve(process.env.HOME, '.lcodeconfig');
  return fs.existsSync(dynamicConfigPath);
}
