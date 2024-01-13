import React from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import { useLocation } from "@docusaurus/router";
import Link from "@docusaurus/Link";

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

export default function NotFoundContent({ className }) {
  const location = useLocation();
  const estimatedSearchQuery = estimateSearch(location);
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

          {location.pathname.startsWith("/v1") ? (
            <p>
              The V1 Pants docs can be found at{" "}
              <Link to="https://v1.pantsbuild.org/">
                https://v1.pantsbuild.org/
              </Link>
            </p>
          ) : (
            <span>
              <p>
                Try a{" "}
                <Link
                  to={`/search?q=${encodeURIComponent(estimatedSearchQuery)}`}
                >
                  search for '{estimatedSearchQuery}'
                </Link>
                ?
              </p>
              <p>
                Otherwise, if you think this is a mistake, please file an issue
                at{" "}
                <Link to="https://github.com/pantsbuild/pants">
                  https://github.com/pantsbuild/pants
                </Link>
              </p>
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
