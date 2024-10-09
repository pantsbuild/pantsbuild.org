import versions from "./versions.json";
import old_site_redirects from "./old_site_redirects.js";
import captionedCode from "./src/remark/captioned-code.js";
import tabBlocks from "docusaurus-remark-plugin-tab-blocks";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

import { themes as prismThemes } from "prism-react-renderer";

const organizationName = "pantsbuild";
const projectName = "pantsbuild.org";

const numberOfSupportedStableVersions = 2;

// Controls for how much to build:
//  - (No env vars set) -> Just uses the docs from `/docs/` (Docusaurus calls this "current version"), and no blog.
//  - PANTSBUILD_ORG_INCLUDE_VERSIONS=<version>,<version> -> Use current version and versions specified
//  - PANTSBUILD_ORG_INCLUDE_BLOG=1 -> Include the blog.
// Note that `NODE_ENV === 'production' builds _everything_.
const isDev = process.env.NODE_ENV === "development";

// Versions
const onlyIncludeVersions = isDev
  ? process.env.PANTSBUILD_ORG_INCLUDE_VERSIONS
    ? ["current"].concat(
        (process.env.PANTSBUILD_ORG_INCLUDE_VERSIONS || "").split(",")
      )
    : ["current"]
  : undefined;

// In Docusaurus terms, "current" == main == trunk == dev.  It is *newer* than
// the newest in versions.json
function getCurrentVersion() {
  const lastReleasedVersion = versions[0];
  const version = parseInt(lastReleasedVersion.replace("2.", ""), 10);
  return `2.${version + 1}`;
}

const currentVersion = getCurrentVersion();

const isCurrentVersion = (shortVersion) => shortVersion === currentVersion;

const getFullVersion = (shortVersion) => {
  const parentDir = isCurrentVersion(shortVersion)
    ? "docs"
    : path.join("versioned_docs", `version-${shortVersion}`);
  const helpAll = JSON.parse(
    fs.readFileSync(path.join(parentDir, "reference", "help-all.json"), "utf8")
  );

  const pantsVersion = helpAll["scope_to_help_info"][""]["advanced"].find(
    (help) => help["config_key"] === "pants_version"
  );

  const hardcoded = pantsVersion["value_history"]["ranked_values"].find(
    (value) => value["rank"] == "HARDCODED"
  );

  return hardcoded["value"];
};

const isPrereleaseVersion = (fullVersion) => {
  // Check if it's one of xx.xx.0.dev0, xx.xx.0a0, xx.xx.0b0,  xx.xx.0rc0, etc.
  // We don't treat patch versions pre-releases as pre-releases, since it looks weird.
  // Optimally we shouldn't sync those either way, but some have ended up here by accident.
  const rex = /^(\d+\.\d+\.0)(\.dev|a|b|rc)\d+$/;

  return rex.test(fullVersion);
};

const getVersionDetails = () => {
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
          shortVersion == newestPreReleaseVersion ? "prerelease" : shortVersion,
      };
    } else if (isMaintained) {
      // a new-enough stable version => so still supported
      config = {
        label: shortVersion,
        banner: "none",
        noIndex: false,
        path: seenStableVersions == 0 ? "stable" : shortVersion,
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
};

const versionDetails = getVersionDetails();

const mostRecentPreReleaseVersion = versionDetails.find(
  (ver) => ver.isPrerelease && !ver.isCurrent
);

const mostRecentStableVersion = versionDetails.find(
  ({ isPrerelease }) => !isPrerelease
);

// Blog
const includeBlog = process.env.PANTSBUILD_ORG_INCLUDE_BLOG === "1" || !isDev;

// Other information
const formatCopyright = () => {
  const makeLink = (href, text) => `<a href="${href}">${text}</a>`;

  const repoUrl = `https://github.com/${organizationName}/${projectName}`;
  const repoLink = makeLink(repoUrl, "Website source");

  // Only set by CI, so fallback to just `local` for local dev
  const docsCommit = process.env.GITHUB_SHA;
  const commitLink = docsCommit
    ? makeLink(`${repoUrl}/commit/${docsCommit}`, docsCommit.slice(0, 6))
    : "local";

  return `Copyright © Pants project contributors. ${repoLink} @ ${commitLink}.`;
};

const config = {
  title: "Pantsbuild",
  tagline: "The ergonomic build system",
  favicon: "img/favicon.ico",

  url: "https://www.pantsbuild.org",
  baseUrl: "/",
  trailingSlash: false,

  organizationName,
  projectName,

  // @TODO: This should throw on prod
  onBrokenLinks: isDev ? "warn" : "warn",
  onBrokenMarkdownLinks: isDev ? "warn" : "warn",

  webpack: {
    jsLoader: (isServer) => ({
      loader: require.resolve("swc-loader"),
      options: {
        jsc: {
          parser: {
            syntax: "ecmascript",
            tsx: false,
            jsx: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
          target: "es2017",
        },
        module: {
          type: isServer ? "commonjs" : "es6",
        },
      },
    }),
  },

  clientModules: ["./src/js/redirectCodeFragment.js"],
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
        blog: includeBlog && {
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
    // Temporary: Announce the 2024 User Survey.
    announcementBar: {
      content:
        'The Pantsbuild 2024 User Survey is live! Check out the <a href="/blog/2024/10/08/user-survey-2024">blog post</a> or <a target="_blank" href="https://forms.gle/eo7Y4DuxurjaMSZn6">take the survey</a>.',
    },
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
        { to: "/sponsorship", label: "Sponsor", position: "left" },
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
              label: "Who's Hiring?",
              to: "/spotlight/jobs",
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
              label: "Sponsor",
              href: "/sponsorship",
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
  plugins: [
    [
      "./src/js/docsPluginWithTopLevel404.js",
      {
        sidebarPath: require.resolve("./sidebars.js"),
        routeBasePath: "/",
        onlyIncludeVersions,
        lastVersion: onlyIncludeVersions
          ? undefined
          : mostRecentStableVersion.shortVersion,
        versions: Object.fromEntries(
          versionDetails.map(({ isCurrent, shortVersion, config }) => [
            isCurrent ? "current" : shortVersion,
            config,
          ])
        ),
        remarkPlugins: [captionedCode, tabBlocks],
        editUrl: ({ docPath }) => {
          if (docPath.startsWith("reference/")) {
            return undefined;
          }
          return `https://github.com/pantsbuild/pants/edit/main/docs/${docPath}`;
        },
      },
    ],
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: old_site_redirects,
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
  ],
};

module.exports = config;
