export function onRouteUpdate({ location, previousLocation }) {
  // NB: Redirect fragments on reference pages if they look like `code{id}code`.
  //  This only exists because the old readme.com docs used `<code>{id}</code>` in the header
  //  and readme.com turned that into `id="code{id}code"`. So to continue to support those links,
  //  we redirect.
  if (location.hash && location.pathname.includes("/reference/")) {
    const matches = /^#code(.+)code$/.exec(location.hash);
    if (matches) {
      window.location.replace(location.pathname + `#${matches[1]}`);
    }
  }
}
