/**
 * Controls for how much to build:
 * - (No env vars set) -> Just uses the docs from `/docs/` (Docusaurus calls this "current version")
 * - PANTS_VERSIONS_SINCE="{MAJOR.MINOR}" -> Build all versions since/including the specified one
 */

import versions from "./versions.json";
import renamed_path_redirects from "./renamed_path_redirects.js";
import captionedCode from "./src/remark/captioned-code.js";
import tabBlocks from "docusaurus-remark-plugin-tab-blocks";
import fs from "fs";
import path from "path";
import { themes as prismThemes } from "prism-react-renderer";

/***** PROJECT CONSTANTS *****/

const organizationName = "pantsbuild";
const projectName = "pantsbuild.org";
const url = "https://www.pantsbuild.org";
const numberOfSupportedStableVersions = 2;

/***** RUNTIME CONFIG *****/

const isDev = process.env.NODE_ENV === "development";

const sinceVersionIndex = versions.indexOf(process.env.PANTS_VERSIONS_SINCE);
const versionCount = sinceVersionIndex === -1 ? 0 : sinceVersionIndex + 1;
const onlyIncludeVersions = ["current", ...versions.slice(0, versionCount)];

const currentVersion = getCurrentVersion();
const allVersionsDetails = getVersionDetails();

const mostRecentPreReleaseVersion = allVersionsDetails.find(
  (v) => v.isPrerelease && !v.isCurrent
);
const mostRecentStableVersion = allVersionsDetails.find(
  ({ isPrerelease }) => !isPrerelease
);

/***** DOCUSAURUS CONFIG *****/

/** @type {import("@docusaurus/types").Config} */
const config = {
  title: "Pantsbuild",
  tagline: "The ergonomic build system",
  favicon: "img/favicon.ico",

  url: url,
  baseUrl: "/",
  trailingSlash: false,

  organizationName,
  projectName,

  // @TODO: This should throw on prod
  onBrokenLinks: isDev ? "warn" : "warn",

  clientModules: ["./src/js/redirectCodeFragment.js"],

  future: {
    experimental_faster: true,
    v4: true,
  },

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  plugins: [
    [
      "./src/js/docsPluginWithTopLevel404.js",
      {
        editUrl: ({ docPath }) => {
          if (docPath.startsWith("reference/")) {
            return undefined;
          }
          return `https://github.com/pantsbuild/pants/edit/main/docs/${docPath}`;
        },
        lastVersion: onlyIncludeVersions
          ? undefined
          : mostRecentStableVersion.shortVersion,
        onlyIncludeVersions,
        remarkPlugins: [captionedCode, tabBlocks],
        routeBasePath: "/",
        sidebarPath: require.resolve("./sidebars.js"),
        versions: Object.fromEntries(
          allVersionsDetails.map(({ isCurrent, shortVersion, config }) => [
            isCurrent ? "current" : shortVersion,
            config,
          ])
        ),
      },
    ],
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: renamed_path_redirects,
        createRedirects(existingPath) {
          if (existingPath.startsWith("/dev/")) {
            return [existingPath.replace("/dev/", `/${currentVersion}/`)];
          } else if (existingPath.startsWith("/prerelease/")) {
            return [
              existingPath.replace(
                "/prerelease/",
                `/${mostRecentPreReleaseVersion.shortVersion}/`
              ),
            ];
          } else if (existingPath.startsWith("/stable/")) {
            return [
              existingPath.replace(
                "/stable/",
                `/${mostRecentStableVersion.shortVersion}/`
              ),
            ];
          }
          return undefined;
        },
      },
    ],
    function disableExpensiveBundlerOptimizationPlugin() {
      return {
        name: "disable-expensive-bundler-optimizations",
        configureWebpack(_config) {
          return { optimization: { concatenateModules: false } };
        },
      };
    },
  ],

  presets: [
    [
      "@docusaurus/preset-classic",
      {
        gtag: {
          trackingID: "G-SEHBXJRF42",
          anonymizeIP: true,
        },
        debug: process.env.NODE_ENV !== "production",
        docs: false, // NB: See `docsPluginWithTopLevel404.js` reference below
        blog: {
          showReadingTime: true,
          editUrl: `https://github.com/${organizationName}/${projectName}/edit/main/`,
          remarkPlugins: [captionedCode, tabBlocks],
          blogSidebarTitle: "All posts",
          blogSidebarCount: "ALL",
          postsPerPage: "ALL",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],

  themeConfig: {
    image: "img/social-card.png",
    navbar: {
      title: "Pantsbuild",
      logo: {
        alt: "My Site Logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          position: "left",
          sidebarId: "docsSidebar",
          label: "Docs",
        },
        {
          type: "docSidebar",
          position: "left",
          sidebarId: "referenceSidebar",
          label: "Reference",
        },
        { to: "/blog", label: "Blog", position: "left" },
        { to: "/sponsors", label: "Sponsors", position: "left" },
        // Right
        {
          type: "docsVersionDropdown",
          position: "right",
          dropdownActiveClassDisabled: true,
          dropdownItemsAfter: [
            { type: "html", value: '<hr class="dropdown-separator">' },
            { to: "/versions", label: "All Versions" },
          ],
        },
        {
          type: "dropdown",
          label: "Slack",
          position: "right",
          items: [
            {
              label: "Workspace",
              href: "https://pantsbuild.slack.com",
            },
            {
              label: "Workspace Invite",
              href: "https://docs.google.com/forms/d/e/1FAIpQLSf9zgf-MXRnVDJbrVEST3urqneq7LCcy0zw8qU-GH4hPMn52A/viewform?usp=sf_link",
            },
            {
              label: "Linen Mirror",
              href: "https://chat.pantsbuild.org",
            },
          ],
        },
        {
          href: "https://github.com/pantsbuild/pants",
          label: "GitHub",
          position: "right",
        },
        {
          type: "search",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Spotlight",
          items: [
            {
              label: "Users",
              to: "/spotlight/users",
            },
            {
              label: "Testimonials",
              to: "/spotlight/testimonials",
            },
            {
              label: "Media",
              to: "/spotlight/media",
            },
            {
              label: "Service Providers",
              to: "/spotlight/service-providers",
            },
          ],
        },
        {
          title: "Connect",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/pantsbuild/pants",
            },
            {
              label: "Twitter",
              href: "https://twitter.com/pantsbuild",
            },
            {
              label: "YouTube",
              href: "https://www.youtube.com/@pantsbuild",
            },
            {
              label: "Mailing List",
              href: "https://groups.google.com/forum/#!forum/pants-devel",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Blog",
              to: "/blog",
            },
            {
              label: "Sponsors",
              href: "/sponsors",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Getting Help",
              href: "/community/getting-help",
            },
            {
              label: "Members",
              href: "/community/members",
            },
            {
              label: "Code of Conduct",
              href: "/community/code-of-conduct",
            },
            {
              label: "Meet the Team",
              href: "/community/meet-the-team",
            },
            {
              label: "Maintainers",
              href: "/community/maintainers",
            },
            {
              label: "Contentious Decisions",
              href: "/community/contentious-decisions",
            },
          ],
        },
      ],
      copyright: formatCopyright(),
    },

    algolia: {
      appId: "QD9KY1TRVK",
      apiKey: "487e5f50fad326e6126bf593c06b3310",
      indexName: "pantsbuild",
      contextualSearch: true,
    },

    prism: {
      additionalLanguages: [
        "bash",
        "docker",
        "go",
        "ini",
        "java",
        "json",
        "log",
        "protobuf",
        "python",
        "shell-session",
        "toml",
        // TODO: Add thrift once supported: https://github.com/PrismJS/prism/issues/3641
      ],

      // NB: Not all themes support shell-session well. Check before you change this.
      theme: prismThemes.palenight,
      darkTheme: prismThemes.nightOwl,
    },
  },
};

/***** HELPER UTILITIES *****/

/**
 * In Docusaurus terms, "current" == main == trunk == dev.  It is *newer* than
 * the newest in versions.json - so we artificially bump it's version by 1
 *
 * @returns {string} The current version in the form of "2.{MINOR}"
 */
function getCurrentVersion() {
  const lastReleasedVersion = versions[0];
  const minorVersion = parseInt(lastReleasedVersion.replace("2.", ""), 10);
  return `2.${minorVersion + 1}`;
}

/**
 * Compares the passed in `shortVersion` to the globally available `currentVersion`.
 *
 * @param {string} shortVersion A "{major}.{minor}" form of the version
 * @returns {boolean}
 */
function isCurrentVersion(shortVersion) {
  return shortVersion === currentVersion;
}

/**
 * Check if it's one of xx.xx.0.dev0, xx.xx.0a0, xx.xx.0b0,  xx.xx.0rc0, etc.
 * We don't treat patch versions pre-releases as pre-releases, since it looks weird.
 * Optimally we shouldn't sync those either way, but some have ended up here by accident.
 *
 * @param {string} fullVersion Version in the form "{major}.{minor}.{patch+cycle}"
 * @returns {boolean}
 */
function isPrereleaseVersion(fullVersion) {
  const rex = /^(\d+\.\d+\.0)(\.dev|a|b|rc)\d+$/;
  return rex.test(fullVersion);
}

/**
 * Uses Pants `help-all` to get a full version of the `shortVersion` param.
 * @param {string} shortVersion A "{major}.{minor}" form of the version
 * @returns {string} A "{major}.{minor}.{patch+cycle}" version of the `shortVersion`
 */
function getFullVersion(shortVersion) {
  const parentDir = isCurrentVersion(shortVersion)
    ? "docs"
    : path.join("versioned_docs", `version-${shortVersion}`);
  const helpAll = JSON.parse(
    fs.readFileSync(path.join(parentDir, "reference", "help-all.json"), "utf8")
  );

  // In help.json, find: `"config_key": "pants_version"` (also in "env_var_to_help_info")
  const pantsVersionObj = helpAll["scope_to_help_info"][""]["advanced"].find(
    (help) => help["config_key"] === "pants_version"
  );

  // Looks for this:
  // {
  //   "details": null,
  //   "rank": "HARDCODED",
  //   "value": "2.31.0rc0"
  // },
  const hardcodedRankedValue = pantsVersionObj["value_history"][
    "ranked_values"
  ].find((value) => value["rank"] === "HARDCODED");

  return hardcodedRankedValue["value"];
}

/**
 * @typedef {Object} VersionDetail
 * @property {string} shortVersion - The `{major}.{minor}` version string
 * @property {string} fullVersion - The `{major}.{minor}.{patch+cycle}` string
 * @property {boolean} isMaintained - Whether the version is within the supported stability window
 * @property {boolean} isPrerelease - Whether the version is a pre-release
 * @property {boolean} isCurrent - Whether this is the "dev" docs version from the local /docs/ folder
 * @property {import("@docusaurus/plugin-content-docs").VersionOptions} config - The Docusaurus version options object
 */

/**
 * Generates metadata and Docusaurus configuration for all documentation versions.
 *
 * It iterates from newest to oldest to determine which versions should be labeled as "stable",
 * "prerelease", or "deprecated" based on the global `numberOfSupportedStableVersions` setting.
 *
 * @returns {VersionDetail[]} An array of version details and their associated UI configurations.
 */
function getVersionDetails() {
  /** @type {VersionDetail[]} */
  const versionDetails = [];

  let seenStableVersions = 0;
  let newestPreReleaseVersion = null;

  // Construct the configuration for each version. NB. iterating from newest to oldest is important,
  // to be able to label too-old stable versions as unsupported.
  for (const shortVersion of [currentVersion, ...versions]) {
    const fullVersion = getFullVersion(shortVersion);

    // NB. "maintained" versions includes pre-releases
    const isMaintained = seenStableVersions < numberOfSupportedStableVersions;
    const isPrerelease = isPrereleaseVersion(fullVersion);
    const isCurrent = isCurrentVersion(shortVersion);
    if (!isCurrent && isPrerelease && newestPreReleaseVersion === null) {
      newestPreReleaseVersion = shortVersion;
    }

    // compute the appropriate configuration this version
    /** @type {import("@docusaurus/plugin-content-docs").VersionOptions} */
    let config;
    if (isCurrent) {
      // current version => dev
      config = {
        label: `${shortVersion} (dev)`,
        path: "dev",
      };
    } else if (isPrerelease) {
      // prerelease => prerelease
      config = {
        label: `${shortVersion} (prerelease)`,
        banner: "unreleased",
        noIndex: false,
        path:
          shortVersion === newestPreReleaseVersion
            ? "prerelease"
            : shortVersion,
      };
    } else if (isMaintained) {
      // a new-enough stable version => so still supported
      config = {
        label: shortVersion,
        banner: "none",
        noIndex: false,
        path: seenStableVersions === 0 ? "stable" : shortVersion,
      };
    } else {
      // stable, but too old => deprecated
      config = {
        label: `${shortVersion} (deprecated)`,
        banner: "unmaintained",
        noIndex: true,
        path: shortVersion,
      };
    }

    versionDetails.push({
      shortVersion,
      fullVersion,
      isMaintained,
      isPrerelease,
      isCurrent,
      config,
    });

    if (!isPrerelease) {
      seenStableVersions += 1;
    }
  }
  return versionDetails;
}

/**
 * Returns a copyright string formatted with globals from this file.
 *
 * @returns {string} Copyright string
 */
function formatCopyright() {
  const makeLink = (href, text) => `<a href="${href}">${text}</a>`;

  const repoUrl = `https://github.com/${organizationName}/${projectName}`;
  const repoLink = makeLink(repoUrl, "Website source");

  // Only set by CI, so fallback to just `local` for local dev
  const docsCommit = process.env.GITHUB_SHA;
  const commitLink = docsCommit
    ? makeLink(`${repoUrl}/commit/${docsCommit}`, docsCommit.slice(0, 6))
    : "local";

  return `Copyright © Pants project contributors. ${repoLink} @ ${commitLink}.`;
}

module.exports = config;
