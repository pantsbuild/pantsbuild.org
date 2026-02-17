import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

const docsPluginPath = "./src/js/docsPluginWithTopLevel404.js";

// extract the plugin configuration from docusaurus and use this to deduce the "version" references
// for the link component
const useVersionConfigs = () => {
  const { siteConfig } = useDocusaurusContext();

  const [_, docsPluginConfig] = siteConfig.plugins.find(
    (pair) => pair[0] == docsPluginPath
  );
  if (!docsPluginConfig) {
    throw new Error(
      `failed to find docs plugin at ${docsPluginPath} in docusaurus.config.js; has something been renamed?`
    );
  }

  const current = docsPluginConfig.versions.current;
  return {
    "current-dev": current,
    // When running the dev server, we might be only showing the "current" docs (unless
    // PANTS_VERSIONS_SINCE is set), in which lastVersion may not be set, so we just
    // fallback to the current version to keep things working
    "last-stable": docsPluginConfig.lastVersion
      ? docsPluginConfig.versions[docsPluginConfig.lastVersion]
      : current,
  };
};

/**
 * Link to a particular path within auto-generated docs & reference, "live" for the appropriate version.
 *
 * For instance, to link to /2.19/docs/introduction/welcome-to-pants
 * for whatever the current stable version is, use:
 *
 *     <VersionedDocsLink version="latest-stable" unversionedPath="docs/introduction/welcome-to-pants">Welcome!</VersionedDocsLink>
 *
 * @param unversionedPath - the URL path without the leading /2.x/ version bit
 * @param version - the description of the version to link to: `current-dev` (Pants' main branch), `last-stable` (most recent stable)
 * @param linkProps - any other parameters to pass to @docusaurus/Link (including `children`)
 */
export default function VersionedDocsLink({
  unversionedPath,
  version,
  ...linkProps
}) {
  const versionConfigs = useVersionConfigs();

  const versionConfig = versionConfigs[version];
  if (!versionConfig) {
    const supported = Object.keys(versionConfigs).join(", ");
    throw new Error(
      `failed to find configuration for version="${version}" with unversionedPath="${unversionedPath}"; supported version values are: ${supported}`
    );
  }

  const to = `/${versionConfig.path}/${unversionedPath}`;
  return <Link to={to} {...linkProps} />;
}
