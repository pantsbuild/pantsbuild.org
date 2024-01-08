export function onRouteUpdate({ location, previousLocation }) {
  if (location.hash && location.pathname.includes("/reference/")) {
    const matches = /^#code(.+)code$/.exec(location.hash);
    if (matches) {
      window.location.replace(location.pathname + `#${matches[1]}`);
    }
  }
  console.log(location);
}
