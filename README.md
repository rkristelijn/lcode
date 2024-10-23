# lcode

This CLI tool lists all your repositories, and upon selection, it starts Visual Studio Code.

## Usage

Using global install:

```shell
npm i -g @rkristelijn/lcode
lcode [path] [maxDepth]
```

Using npx:

```shell
npx @rkristelijn/lcode [path] [maxDepth]
```

### Arguments

1. `path` (optional): The path to start searching from. Defaults to the current directory if not provided.
2. `maxDepth` (optional): The maximum depth to search for repositories. Defaults to 3 if not provided.

### Examples

Using global install:

```shell
lcode
lcode ~
lcode ~/my-repos 4
```

> Note, running lcode on `~` may accidentaly trigger some warnings. If so, some additional directories need to be excluded. Please create an issue or raise a PR.

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
