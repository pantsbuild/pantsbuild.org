import React from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import { useLocation } from "@docusaurus/router";
import Link from '@docusaurus/Link';

export default function NotFoundContent({ className }) {
  const location = useLocation();
  return (
    <main className={clsx("container margin-vert--xl", className)}>
      <div className="row">
        <div className="col col--6 col--offset-3">
          <Heading as="h1" className="hero__title">
            Page Not Found
          </Heading>
          <p>We could not find what you were looking for in any of our pockets.</p>


          {location.pathname.startsWith("/v1") ?
            <p>The V1 Pants docs can be found at <Link to="https://v1.pantsbuild.org/">https://v1.pantsbuild.org/</Link></p> :
            <span>
              <p>Our excellent <Link to="/search">search page</Link> might be helpful.</p>
              <p>
              Otherwise, if you think this is a mistake, please file an issue at  <Link to="https://github.com/pantsbuild/pants">https://github.com/pantsbuild/pants</Link>
              </p>
            </span>
          }
        </div>
      </div>
    </main>
  );
}
