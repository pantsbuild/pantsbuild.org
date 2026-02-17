import React, { useEffect } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import { useLocation } from "@docusaurus/router";
import BrowserOnly from "@docusaurus/BrowserOnly";
import Link from "@docusaurus/Link";

// TODO: This is stripped after SSG, so need to inject this from the docusaurus config
// const sinceVersionIndex = versions.indexOf(process.env.PANTS_VERSIONS_SINCE);
// const archivedVersions =
//   sinceVersionIndex === -1 ? [] : versions.slice(sinceVersionIndex + 1);
const HARDCODED_ARCHIVE_VERSIONS = [
  "2.27",
  "2.26",
  "2.25",
  "2.24",
  "2.23",
  "2.22",
  "2.21",
  "2.20",
  "2.19",
  "2.18",
  "2.17",
  "2.16",
  "2.15",
  "2.14",
  "2.13",
  "2.12",
  "2.11",
  "2.10",
  "2.9",
  "2.8",
  "2.7",
  "2.6",
  "2.5",
  "2.4",
  "2.3",
  "2.2",
  "2.1",
  "2.0",
];

// A component of a URL that might be interesting is any sequence of things separated by these punctuations
const componentsRe = /[^-/ ]+/g;
// Several things that appear in URLs are not interesting,
// e.g. / docs / foo should become just "foo", not "docs foo",
// similarly "pants" generally won't be informative, nor will a version specifier
const boringComponents = /^(doc|docs|reference|pants|v?[0-9]+\.[x0-9]+)$/;

const estimateSearch = (location) => {
  // This site generally use the path and hash/fragment, so look at them to find any tidbits that
  // may suggest what the user was looking for
  const strings = [location.pathname, location.hash];
  const allComponents = strings
    .map(decodeURI)
    .flatMap((s) => [...s.matchAll(componentsRe)].flat());
  const interestingComponents = allComponents.filter(
    (s) => !s.match(boringComponents)
  );
  return interestingComponents.join(" ");
};

/**
 * This runs when there is a 404, but first checks if the URL
 * is trying to point at any archived v2 versions of the site - in which case
 * it will attempt to re-direct the user.
 */
export default function NotFoundContent({ className }) {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;

    const isArchived = HARDCODED_ARCHIVE_VERSIONS.some(
      (version) =>
        currentPath.startsWith(`/${version}/`) || currentPath === `/${version}`
    );

    if (isArchived) {
      // Redirect to the v2 archive
      window.location.replace(`https://v2.pantsbuild.org${currentPath}`);
    }
  }, [location]);

  return (
    <main className={clsx("container margin-vert--xl", className)}>
      <div className="row">
        <div className="col col--6 col--offset-3">
          <Heading as="h1" className="hero__title">
            Page Not Found
          </Heading>
          <p>
            We could not find what you were looking for in any of our pockets.
          </p>

          <BrowserOnly>
            {() => {
              const estimatedSearchQuery = estimateSearch(location);
              return (
                <span>
                  {location.pathname.startsWith("/v1") ? (
                    <p>
                      The V1 Pants docs can be found at{" "}
                      <Link to="https://v1.pantsbuild.org/">
                        https://v1.pantsbuild.org/
                      </Link>
                    </p>
                  ) : (
                    <p>
                      Try a{" "}
                      <Link
                        to={`/search?q=${encodeURIComponent(
                          estimatedSearchQuery
                        )}`}
                      >
                        search for '{estimatedSearchQuery}'
                      </Link>
                      ?
                    </p>
                  )}
                  <p>
                    Otherwise, if you think this is a mistake, please file an
                    issue at{" "}
                    <Link to="https://github.com/pantsbuild/pants">
                      https://github.com/pantsbuild/pants
                    </Link>
                  </p>
                </span>
              );
            }}
          </BrowserOnly>
        </div>
      </div>
    </main>
  );
}
