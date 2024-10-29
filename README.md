# lcode

This CLI tool lists all your repositories, and upon selection, it changes path to the repo and starts Visual Studio Code or any other command provided.

## Demo

![demo](./docs/demo.mp4)

## Usage

Using global install:

```shell
npm i -g @rkristelijn/lcode # install globally
lcode # runs in the current directory with maxdepth to 3
lcode ~ 5 # runs in ~ with maxdepth 5
lcode ~ 5 zsh # runs in ~ with maxdepth 5 and executes zsh instead of vscode
lcode ~ 5 \". ~/.nvm/nvm.sh && nvm use && code .\" # executes nvm to load proper node version and starts
lcode ~ 5 \"[ -f .nvmrc ] && . ~/.nvm/nvm.sh && nvm use; code .\" # only executes nvm when .nvmrc exists to load proper node version and starts

# with config file
lcode --init # creates a config file with default ~ and 5 in ~/.lcodeconfig
code ~/.lcodeconfig # opens up the config file
lcode --cleanup # removes the config file
```

Using npx:

```shell
npx @rkristelijn/lcode [path] [maxDepth]
```

### Arguments

1. `path` (optional): The path to start searching from. Defaults to the current directory if not provided.
2. `maxDepth` (optional): The maximum depth to search for repositories. Defaults to 3 if not provided.
3. `cmd` (optional): The command to execute, defaults to `code .`

### Configuration

You can create a configuration file named `.lcodeconfig` in your home directory (`~`) to set default values for the `path` and `maxDepth` arguments. Example:

```json
{
  "path": "~/Documents", // your starting path, like ~
  "maxDepth": 3, // max depth of searching for git repos
  "execute": "bash" // executes bash instead of 'code .'
}
```
