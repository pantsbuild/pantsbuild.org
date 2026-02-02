# pantsbuild.org

All of the material and stitching for [pantsbuild.org](https://www.pantsbuild.org).

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

The documentation site is built using [Docusaurus](https://docusaurus.io) and some additional dependencies for rendering charts and code.

### Package Manager

This project uses [pnpm](https://pnpm.io) as the package manager. It's roughly a drop-in replacement for `npm`, but it's typically faster and uses less disk space across multiple projects.

Installation instructions for `pnpm` can be found [here](https://pnpm.io/installation).

Optionally, you can install [nvm](https://github.com/nvm-sh/nvm) to manage multiple versions of [Node.js](https://nodejs.org) and switch between them easily. This project uses Node.js 24.

From the root of this repo:

```bash
# Optionally run
nvm use

# Install all dependencies as per the package.json and pnpm-lock.yaml
pnpm install

# (Optional) This is also a good time to audit the dependencies to make sure we're up-to-date
pnpm audit --fix
pnpm install
```

### Starting a development server

Once you've cloned the project and installed dependencies with `pnpm install`, start a development server:

```bash
pnpm start

# ...
# [SUCCESS] Docusaurus website is running at: http://localhost:3000/
# ...
```

By default, only the "next" docs (e.g. the docs for the version that maps to `main`) will get built.

To include the blog, use:

```bash
PANTSBUILD_ORG_INCLUDE_BLOG=1 pnpm start
```

To include any version(s) in addition to the "next" version:

```bash
PANTSBUILD_ORG_INCLUDE_VERSIONS=$version1,$version2 pnpm start
```

To render uncommitted version-specific docs from a local Pants repo:

```bash
cp -r <path/to/pants/repo>/docs/docs ./docs && pnpm start
```

### Building for production

To build a production-optimized version of the site, run the following command (this may take several minutes):

```bash
NODE_ENV=production NODE_OPTIONS="--max-old-space-size=15000" pnpm build
```

Note: the [--max-old-space-size](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-mib) argument is a remnant from when this site was built using `yarn` and `webpack` instead of `pnpm` and `rspack` - it may not be required anymore.

## Deployment

The site is fully deployed via Github Actions to Github Pages. Refer to the [deployment workflow](./.github/workflows/deploy.yml) for more information. The [sync-docs workflow](./.github/workflows/sync_docs.yml) is responsible for merging changes from the `pantsbuild/pants` repo.
