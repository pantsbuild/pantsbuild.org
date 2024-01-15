#!/usr/bin/env bash

has_label_automation_sync_docs="$1"

# if the label exists, any changes are fine, so no need to check
if [[ ${has_label_automation_sync_docs} != true ]]; then
    autogened=(
        docs/docs
        docs/reference/help-all.json
        versioned_docs/*/docs
        versioned_docs/*/reference/help-all.json
    )

    git fetch --depth=1 origin "${GITHUB_BASE_REF}"

    if ! git diff --quiet FETCH_HEAD HEAD -- "${autogened[@]}"; then
        echo "::group::Full diff"
        git diff FETCH_HEAD HEAD -- "${autogened[@]}"
        echo "::endgroup::"

        cat <<EOF
Error: found changes to files that are synced from <https://github.com/pantsbuild/pants>:

$(git diff --name-only FETCH_HEAD HEAD -- "${autogened[@]}")

Those files should be changed in <https://github.com/pantsbuild/pants>, and are
automatically synced to this repository after each release.

(If this change is intentional and you're sure it's appropriate, add the
'automation:sync-docs' label.)
EOF

        exit 1
    fi
fi

# NB. in future, it would be nice for this to be packaged as a test that one can run
# locally, e.g. https://github.com/pantsbuild/pants/discussions/18235
npm run generate-reference-all

if ! git diff --quiet ; then
    echo "::group::Full diff"
    git diff
    echo "::endgroup::"

    cat <<EOF
Error: the references have differences between what's committed and what would be
generated. Either:

- if you made changes to the generation scripts, please regenerate with `npm run
  generate-reference-all` or `npm run generate-reference <specific directory>`.

- if you have edited the files directly, https://github.com/pantsbuild/pants is the
  source of truth: make the changes there and they will be synced here on the next
  release.
EOF

    exit 1
fi
