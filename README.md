# lcode

This CLI tool lists all your repositories, and upon selection, it starts Visual Studio Code.

## Usage

Using global install:

```shell
npm i -g @rkristelijn/lcode
lcode # runs in the current directory with maxdepth to 3
lcode ~ 5 # runs in ~ with maxdepth 5
lcode --init # creates a config file with default ~ and 5
lcode --cleanup # removes the config file
```

Using npx:

```shell
npx @rkristelijn/lcode [path] [maxDepth]
```

### Arguments

1. `path` (optional): The path to start searching from. Defaults to the current directory if not provided.
2. `maxDepth` (optional): The maximum depth to search for repositories. Defaults to 3 if not provided.

### Configuration

You can create a configuration file named `.lcodeconfig` in your home directory (`~`) to set default values for the `path` and `maxDepth` arguments. Example:

```json
{
  "path": "~/my-repos",
  "maxDepth": 3
}
```

### Examples

Using global install:

```shell
lcode
lcode ~/my-repos
lcode ~/my-repos 4
```

Using npx:

```shell
npx @rkristelijn/lcode
npx @rkristelijn/lcode ~/my-repos
npx @rkristelijn/lcode ~/my-repos 4
```

## Prerequisites

1. You need to execute it from the root where all your repos live.
   Alternatively, you can run `npx @rkristelijn/lcode ~/my-repos`.

## Background

Actually, I just wanted to `cd` into the selected directory; however, it does, but then exits the program, and you are back in the original working directory. Hence, I started VSCode instead.
