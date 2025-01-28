---
  authors: [cburroughs]
  tags: [announcement]
  # Date of the actual release
  date: 2025-01-28
---

# Pants 2.24.0 is released!

<CaptionedImg src={require("./splash.jpeg").default}>
Photo by [Jiawei Zhao
](https://unsplash.com/@jiaweizhao)
on
[Unsplash](https://unsplash.com/photos/tuxedo-cat-in-brown-cardboard-box-W-ypTC6R7_k)
</CaptionedImg>

{/_ truncate _/}

We are pleased to announce Pants [2.24.0](https://github.com/pantsbuild/pants/blob/2.24.x/docs/notes/2.24.x.md), the latest release of [Pantsbuild, the scalable and ergonomic build system](https://www.pantsbuild.org/). To update, set `pants_version = "2.24.0"` in your `pants.toml`. If you're not using Pants yet, [get started now](https://www.pantsbuild.org/2.24/docs/getting-started).

_Highlights in [2.24](https://github.com/pantsbuild/pants/blob/2.24.x/docs/notes/2.24.x.md) include_:

- 📦 Out of the box support for Python 3.13.
- 🪛 `pants export --bin` allows exporting more tools for use outside Pants
- 🐍 A new experimental Python Provider backend using [Python Build Standalone](https://gregoryszorc.com/docs/python-build-standalone/main/).
- 🔜 A new option system that unlocks future changes.
- 🐞 And a whole bunch of updates, bugfixes, and general improvements.

And some heads up of coming changes:

- Pants 2.24x will suggest you upgrade to the at least version `0.12.2` of the `pants` [launcher binary](https://github.com/pantsbuild/scie-pants/) [following the upgrade instructions](https://www.pantsbuild.org/2.24/docs/getting-started/installing-pants#upgrading-pants). This supports underlying improvements coming in Pants 2.25.
- As in the previous release, in `2.24.x` we continue to run both the new and the legacy options systems concurrently and compare the results, issuing warnings if there are any discrepancies. If you do encounter discrepancies that you can't resolve on your own, please [reach out to us!](https://www.pantsbuild.org/community/getting-help).

Check out the [full release notes](https://github.com/pantsbuild/pants/blob/2.24.x/docs/notes/2.24.x.md). Pants is an open-source project, and the changes are all contributed by our community. If you want to see something more in the next changelog, join us on [GitHub](https://github.com/pantsbuild/pants) and become a [contributor](https://www.pantsbuild.org/stable/docs/contributions).

We also offer [formal sponsorship tiers for companies](https://www.pantsbuild.org/sponsorship), as well as individual sponsorships via [GitHub](https://github.com/sponsors/pantsbuild). These help pay for the ongoing development and hosting costs, and are managed by the Pants Build non-profit organization.

To see Pants in action, explore our example repositories:

- [example-python](https://github.com/pantsbuild/example-python)
- [example-adhoc](https://github.com/pantsbuild/example-adhoc/)
- [example-codegen](https://github.com/pantsbuild/example-codegen)
- [example-docker](https://github.com/pantsbuild/example-docker)
- [example-golang](https://github.com/pantsbuild/example-golang)
- [example-javascript](https://github.com/pantsbuild/example-javascript)
- [example-jvm](https://github.com/pantsbuild/example-jvm)
- [example-kotlin](https://github.com/pantsbuild/example-kotlin)
- [example-visibility](https://github.com/pantsbuild/example-visibility)

And let us know what you think in [Slack!](https://www.pantsbuild.org/community/getting-help)

Pants wouldn't be possible without everyone who contributed to `2.24.0`, including everyone who shared feedback on changes and who tested release candidates! Thank you very much!
