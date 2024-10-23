# lcode

This cli tool lists all your repositories, uppon selection it starts Visual Studio Code.

## Usage

Using global install:

```shell
npm i -g @rkristelijn/lcode
lcode
? Select a git repository: hub
  hub/npm-check
  hub/npm-audit-plus-plus
❯ hub/nextjs-getting-started
  hub/next-auth-example
  hub/my-strapi-project
  hub/material-ui-nextjs-ts
  hub/macbook-text-replacement
```

Using npx:

```shell
❯ npx @rkristelijn/lcode
Need to install the following packages:
@rkristelijn/lcode@1.0.0
Ok to proceed? (y) y
? Select a git repository: hub
  hub/npm-check
  hub/npm-audit-plus-plus
❯ hub/nextjs-getting-started
  hub/next-auth-example
  hub/my-strapi-project
  hub/material-ui-nextjs-ts
  hub/macbook-text-replacement
```

## Prerequisites

1. You need to execute it from the root where all your repos live
   Alternatively you can run `npx @rkristelijn/lcode ~/my-repos`

## Background

Actually I just wanted to cd into the selected directory however it does, but then exits the program and you are back on the original working directory. Hence I started vscode instead.
