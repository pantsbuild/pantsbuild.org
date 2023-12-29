import versions from "./versions.json";
import redirects from "./old_site_redirects.js";
import captionedCode from "./src/remark/captioned-code.js";

import { themes as prismThemes } from "prism-react-renderer";

function getCurrentVersion() {
  const lastReleasedVersion = versions[0];
  const version = parseInt(
    lastReleasedVersion.replace("2.", "").replace(".x", ""),
    10
  );
  return `2.${version + 1}.x`;
}

// Controls for how much to build:
//  - (No env vars set) -> Just uses the docs from `/docs/` (Docusaurus calls this "current version"), and no blog.
//  - PANTSBUILD_ORG_INCLUDE_VERSIONS=<version>,<version> -> Use current version and versions specified
//  - PANTSBUILD_ORG_INCLUDE_BLOG=1 -> Include the blog.
// Note that `NODE_ENV === 'production' builds _everything_.
const isDev = process.env.NODE_ENV === "development";
const disableVersioning =
  isDev && process.env.PANTSBUILD_ORG_INCLUDE_VERSIONS === undefined;
const onlyIncludeVersions = isDev
  ? process.env.PANTSBUILD_ORG_INCLUDE_VERSIONS
    ? ["current"].concat(
        (process.env.PANTSBUILD_ORG_INCLUDE_VERSIONS || "").split(",")
      )
    : ["current"]
  : undefined;
const currentVersion = getCurrentVersion();
const includeBlog = process.env.PANTSBUILD_ORG_INCLUDE_BLOG === "1" || !isDev;

const config = {
  title: "Pantsbuild",
  tagline: "The ergonomic build system",
  favicon: "img/favicon.ico",

  url: "https://pantsbuild.github.io",
  baseUrl: "/",
  trailingSlash: false,

  organizationName: "pantsbuild",
  projectName: "pantsbuild.org",

  // @TODO: This should throw on prod
  onBrokenLinks: isDev ? "warn" : "warn",
  onBrokenMarkdownLinks: isDev ? "warn" : "warn",

  presets: [
    [
      "@docusaurus/preset-classic",
      {
        debug: process.env.NODE_ENV !== "production",
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          routeBasePath: "/",
          disableVersioning,
          onlyIncludeVersions,
          lastVersion: onlyIncludeVersions ? undefined : versions[1],
          versions: {
            current: {
              label: `${currentVersion} (dev)`,
              path: currentVersion,
            },
            ...(disableVersioning
              ? {}
              : versions.reduce((acc, version, index) => {
                  acc[version] = {
                    label:
                      index === 0
                        ? `${version} (prerelease)`
                        : index < 3
                          ? version
                          : `${version} (deprecated)`,
                    banner:
                      index == 0
                        ? "unreleased"
                        : index < 3
                          ? "none"
                          : "unmaintained",
                    noIndex: index >= 3,
                    path: version,
                  };
                  return acc;
                }, {})),
          },
          remarkPlugins: [captionedCode],
          editUrl: "https://github.com/pantsbuild/pantsbuild.org/edit/main/",
        },
        blog: includeBlog && {
          showReadingTime: true,
          editUrl: "https://github.com/pantsbuild/pantsbuild.org/edit/main/",
          remarkPlugins: [captionedCode],
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
        { to: "/sponsorship", label: "Sponsor", position: "left" },
        // Right
        {
          type: "html",
          position: "right",
          value: "(Search coming soon!)",
        },
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
              label: "Whos Hiring?",
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
      copyright: `Copyright © ${new Date().getFullYear()} Pants project contributors. Built with Docusaurus.`,
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
      "@docusaurus/plugin-client-redirects",
      {
        redirects,
      },
    ],
  ],
};

module.exports = config;
