import { default as pluginContentDocs } from "@docusaurus/plugin-content-docs";

/**
 * This function monkeypatches `@docusaurus/plugin-content-docs` to fix 404 handling when `routeBasePath` is `/`.
 * It is a workaround for https://github.com/facebook/docusaurus/issues/9688.
 *
 * Without this, `plugin-content-docs` captures all `/*` routes, causing non-existent top-level paths (e.g. `/foo`)
 * to render as empty pages instead of the 404 component.
 *
 * We intercept `addRoute` to inject a low-priority (`-1`) wildcard route that falls back to `@theme/NotFound/Content`.
 *
 * @param {import("@docusaurus/types").LoadContext} context
 * @param {import("@docusaurus/plugin-content-docs").PluginOptions} options
 */
export default async function patchedPluginContentDocs(context, options) {
  const result = await pluginContentDocs(context, options);
  const actualContentLoaded = result.contentLoaded;

  result.contentLoaded = async function ({ content, actions }) {
    let docsRouteConfig = undefined;
    const actualAddRoute = actions.addRoute;

    actions.addRoute = function (routeConfig) {
      if (docsRouteConfig !== undefined) {
        throw "Expected only one call to addRoute!";
      }
      docsRouteConfig = routeConfig;
    };

    const result = await actualContentLoaded({ content, actions });

    docsRouteConfig.routes.push({
      path: "/*",
      component: "@theme/NotFound/Content",
      /* NB: Routes are sorted based on a heuristic: https://github.com/facebook/docusaurus/blob/d94adf6a6c925f2bd5ef09a75c5e8a66a0b7e7f9/packages/docusaurus/src/server/plugins/routeConfig.ts#L30
          Our route must come last based on this heuristic. In order to accomplish that:
            - We must have at least one route, or else we unconditionally come first.
              It'll never get matched, but still must be valid
            - Our priority must be _lower_ (with the default of 0).
      */
      priority: -1,
      routes: [
        {
          path: "/*",
          component: "@theme/NotFound/Content",
        },
      ],
    });

    actualAddRoute(docsRouteConfig);
    return result;
  };

  return result;
}

export { validateOptions } from "@docusaurus/plugin-content-docs";
