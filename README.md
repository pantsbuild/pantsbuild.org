# pantsbuild.org

All of the material and stitching for [pantsbuild.org](pantsbuild.org).

## Layout

This repository contains three categories of content. Most of it should be edited in this repository, except for the auto-generated documentation for each version of Pants.

### Evergreen pages

`src/` contains content and configuration that isn't associated with a particular version of Pants. In particular, in `src/pages/` you'll find the definitions of [the front page](https://www.pantsbuild.org) and [community information](https://www.pantsbuild.org/community/getting-help) among others. `src/` also contains helpers like MDX/React components, CSS and JS.

These should be edited directly in this repository.

### Blog

`blog/` contains [the Pants blog](https://www.pantsbuild.org/blog). To write a post, follow the structure of other blog posts.

These should be edited directly in this repository.

### Per-version documentation

`docs/` and `versioned_docs/` contains the documentation for each `2.x` release series of pants. After each release of Pants, the documentation is synced to this repository automatically from https://github.com/pantsbuild/pants: the [`sync_docs.yml`](.github/workflows/sync_docs.yml) workflow manages this, and is triggered by the main repository release process.

This **should not** be edited directly in this repository. Instead, edit in <https://github.com/pantsbuild/pants>. To make changes to documentation for stable release series, edit there and cherry-pick to the appropriate milestone (still in <https://github.com/pantsbuild/pants>), so that it's included in the next release in that series.

## Development

The docs site is a JS project, so you'll want `nvm` and `yarn` installed.

Afterwards

```bash
nvm use
yarn install
```

### Dev server

The following command will start the dev server:

```bash
npm start
```

By default, only the "next" docs (e.g. the docs for the version that maps to `main`) will get built.

To include the blog, use:

```bash
PANTSBUILD_ORG_INCLUDE_BLOG=1 npm start
```

To include any version(s) in addition to the "next" version:

```bash
PANTSBUILD_ORG_INCLUDE_VERSIONS=$version1,$version2 npm start
```

### Building the real deal

To build the site, run:

```bash
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=12288" npm run build
```

(Note: Node needs more than the default amount of RAM because this site is beefy)

## Tech

The site is fully managed via https://docusaurus.io/ and is published via GitHub Actions to GitHub Pages.
