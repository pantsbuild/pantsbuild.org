# pantsbuild.org

All of the material and stitching for [pantsbuild.org](pantsbuild.org).

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
NODE_OPTIONS="--max-old-space-size=6144" npm run build
```

(Note: Node needs more than the default amount of RAM because this site is beefy)

## Tech

The site is fully managed via https://docusaurus.io/ and is published via GitHub Actions to GitHub Pages.
