import { default as pluginContentDocs } from "@docusaurus/plugin-content-docs";

/*
You: WTH is going on here?!
Me: Ok, umm, please let me explain...
  So, there's this bug: https://github.com/facebook/docusaurus/issues/9688. Basically, because we
  use `routeBasePath` set to `/`, the docs plugin hogs all `/*` routes that aren't hogged by another
  plugin. But that means that "bad" top-level URLs like `/foo` render empty.
You: (nodding)
Me: It's complicated, you can see the comments from the maintainers. Something about `react-router-config`.
  Anyways, there was a suggestion about how to fix it by "automatically add[ing] a `*` not found route
  to all subroutes". This emulates that behavior.
You: I think I get it, but how does this work, exactly?
Me: Ah yeah. So firstly, we use this plugin instead of the docs plugin. This plugin is basically a
  re-export of the docs plugin, but with the `addRoute` plugin API monkeypatched. The monkeypatching
  adds a `*` not found route as a subroute.
You: I see. Well, OK I guess. Carry on.
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
