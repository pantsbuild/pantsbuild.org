---
title: "Anonymous telemetry"
slug: "anonymous-telemetry"
hidden: false
createdAt: "2021-03-14T04:37:07.980Z"
---

Pants can optionally send anonymized telemetry to the Pants project. This data helps us develop and improve Pants by detecting bugs, analyzing usage patterns, and so on.

Telemetry is sent in the background, so it doesn't slow down your Pants runs.

No telemetry is sent until you opt into this feature.

## Opting in to telemetry

To enable telemetry, you set options in the `[anonymous-telemetry]` of your `pants.toml` config file:

```toml pants.toml
[anonymous-telemetry]
enabled = true
repo_id = "<uuid>"
```

Where `<uuid>` is some random identifier unique to your repo, such as one generated by the `uuidgen` program.

An easy way to add this to your `pants.toml` is:

```
printf "\n[anonymous-telemetry]\nenabled = true\nrepo_id = \"$(uuidgen)\"\n" >> pants.toml
```

The anonymous data we receive from telemetry is extremely valuable, and a great help to the project maintainers. We also plan to make your telemetry data available to you for your own analytics. So we hope you are able to opt in. However we understand if you prefer not to.

To explicitly opt out of telemetry and silence any logging about it, set `enabled = false` instead.

## What data is sent

Each Pants run will send the following data:

- The unique id of the run, which is a random uuid prefixed by the timestamp of the run.
- The timestamp of the run.
- The duration of the run.
- The outcome of the run (success or failure).
- Platform information, as returned by [`platform.platform()`](https://docs.python.org/3/library/platform.html#platform.platform) (e.g., `'macOS-10.16-x86_64-i386-64bit'`).
- the implementation of the Python interpreter that Pants ran on, as returned by [`platform.python_implementation()`](https://docs.python.org/3/library/platform.html#platform.python_implementation) (e.g., `'CPython'`).
- The version of the Python interpreter that Pants ran on, as returned by [`platform.python_version()`](https://docs.python.org/3/library/platform.html#platform.python_version) (e.g., `'3.7.3'`).
- The Pants version (e.g., `'2.3.0'`).
- The sha256 hash of the repo id as set in pants.toml.
- The sha256 hash of the concatenation of the repo id and the machine's MAC address, as returned by [`uuid.getnode()`](https://docs.python.org/3/library/uuid.html#uuid.getnode).
- The sha256 hash of the concatenation of the repo id and the username (as returned by [getpass.getuser()](https://docs.python.org/3/library/getpass.html#getpass.getuser)).
- The goals of the run, with custom goals filtered out (e.g., `'test,fmt,lint'`).
- The number of goals run (including custom goals).

## How we ensure anonymity

- We only send sha256 hashes of ids.
- The repo id, even before hashing, is a uuid. So its hash should be robust against dictionary attacks, assuming your uuid generator is strong (e.g., you used `uuidgen` and your system has a strong random number generator).
- The machine and user ids are prefixed by the repo id, so the resulting hashes are similarly robust against dictionary attacks.
- We do not record the IP address or any other envelope information.

> 🚧 In public repos the repo id may be public
>
> The anonymity properties above are ensured for private repos, where `pants.toml`, and therefore your `repo_id`, are private.
>
> For repos that are publicly visible, e.g., on GitHub, the `repo_id` will be visible in your `pants.toml`. So repo-level data is not anonymous. However machine- and user-level data is still anonymous (although somewhat more susceptible to dictionary attacks).
>
> Developers in public repos are usually not concerned about this, since their entire development occurs in the open anyway, via publicly visible code, CI runs, pull request comments and so on. All the telemetry potentially exposes is various stats about Pants usage.
>
> If you still prefer not to expose these stats, you can set the `repo_id` to the empty string. This will remove repo, machine and user ids entirely from the telemetry.

## How we avoid exposing proprietary information

Innocuous data elements such as filenames, custom option names and custom goal names may reference proprietary information. E.g., `path/to/my/secret/project/BUILD`. To avoid accidentally exposing even so much as a secret name:

- We don't send the full command line, just the goals invoked.
- Even then, we only send standard goal names, such as `test` or `lint`, and filter out custom goals.
- We only send numerical error codes, not error messages or stack traces.
- We don't send config or environment variable values.

## Data policies

Data is aggregated and processed on our behalf by [bugout.dev](https://bugout.dev/).

Data can be accessed by selected maintainers of the Pants open source community (as GDPR controllers), by bugout.dev in their capacity as processors of the data, and by Pants users (as GDPR data subjects) when they exercise their Right of Access.

The data retention period is 1 year.

We will honor requests for access and requests for deletion within 14 days of request.