import Mustache from "mustache";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import he from "he";
import prettier from "prettier";

// Load the relevant data
const reference_dir = path.join(process.argv[2], "reference");
const helpAll = JSON.parse(
  fs.readFileSync(path.join(reference_dir, "help-all.json"), "utf8")
);

// Helpers for writing files to reference_dir
function pathify(file) {
  return path.join(reference_dir, file);
}

const prettierConfig = JSON.parse(fs.readFileSync(".prettierrc"));
async function writeFile(file, contents) {
  const parser = path.extname(file).slice(1);
  const formatted = await prettier.format(contents, {
    ...prettierConfig,
    parser,
  });
  await fsPromises.writeFile(pathify(file), formatted);
}

function ensureEmptyDirectory(name) {
  const path = pathify(name);
  fs.rmSync(path, { recursive: true, force: true });
  fs.mkdirSync(path, { recursive: true });
}

// Templates
const subsystemTemplate = fs.readFileSync(
  "reference_codegen/subsystem.mdx.mustache",
  "utf8"
);
const optionTemplate = fs.readFileSync(
  "reference_codegen/option.mdx.mustache",
  "utf8"
);
const targetTemplate = fs.readFileSync(
  "reference_codegen/target.mdx.mustache",
  "utf8"
);
const fieldTemplate = fs.readFileSync(
  "reference_codegen/field.mdx.mustache",
  "utf8"
);
const buildFileSymbolTemplate = fs.readFileSync(
  "reference_codegen/build_file_symbol.mdx.mustache",
  "utf8"
);

function renderSubsystemTemplate(view, helpAll) {
  view.related_subsystems = (
    (helpAll.name_to_goal_info[view.scope] || {}).consumed_scopes || []
  )
    .filter((str) => str !== "" && str !== view.scope)
    .sort()
    .map((str) => {
      return { scope: str, is_goal: helpAll.scope_to_help_info[str].is_goal };
    });
  return Mustache.render(subsystemTemplate, view, { option: optionTemplate });
}

function renderTargetTemplate(view) {
  return Mustache.render(targetTemplate, view, { field: fieldTemplate });
}

function renderBuildFileSymbolTemplate(view) {
  return Mustache.render(buildFileSymbolTemplate, view);
}

function convertDefault(val, type) {
  if (val === true) return "True";
  if (val === false) return "False";
  if (type === "float" && Number.isInteger(val)) return String(val) + ".0";
  if (Array.isArray(val) || typeof val === "object") {
    if (val && Object.keys(val).length === 1) {
      val = JSON.stringify(val, Object.keys(val), 2).replace(/\n/g, "\\n");
    } else if (val === null) return "None";
    else {
      val = JSON.stringify(val, null, 2).replace(/\n/g, "\\n");
    }
  } else {
    val = String(val).replace(/\\n/g, "\\\\n");
  }

  return (
    val
      .replace(buildroot, "<buildroot>")
      .replace(cachedir, "$XDG_CACHE_HOME")
      // this ends up in a template literal, so if it contains literally ${something} we need to
      // ensure that doesn't get interpreted as a substitution
      .replace(/\$/g, "\\$")
  );
}

function escape(val) {
  return he
    .encode(val)
    .replaceAll("&#x60;", "`")
    .replaceAll("{", "&#123;")
    .replaceAll("}", "&#125;");
}

function unescape(val) {
  return he
    .decode(val)
    .replaceAll("`", "&#x60;")
    .replaceAll("&#123;", "{")
    .replaceAll("&#125;", "}");
}

function backtickStartingLineToIgnore(line) {
  // There's a few places with weird syntax that intefere with our naive line-by-line processing
  // of the markdown, so, for now, we just hard-code them to keep things working.
  //
  // Using a proper markdown parser would help solve this.
  return [
    // `helm_deployment` target, `values` field
    "``` helm_deployment(",
    // `deploy_jar` target, `duplicate_policy` field
    "``` duplicate_policy=[",
  ].includes(line);
}

function convertDescription(val) {
  const lines = [];
  let tabbedBlock = false;
  let backtickedBlock = false;
  val.split("\n").forEach((line) => {
    // If we're starting a tabbed block
    if (
      !tabbedBlock &&
      !backtickedBlock &&
      line.startsWith("    ") &&
      lines[lines.length - 1] == ""
    ) {
      tabbedBlock = true;
      if (!line.startsWith("    ```")) {
        lines.push("```");
      }
      lines.push(line.replace("    ", ""));
      return;
    }

    // If we're in a tabbed block
    if (tabbedBlock) {
      // Still tabbed
      if (line.startsWith("    ") || !line) {
        lines.push(line.replace("    ", ""));
        if (line.startsWith("    ```")) {
          tabbedBlock = false;
        }
      } else {
        // Done tabbing
        lines.push("```", "", line);
        tabbedBlock = false;
      }
    }
    // If we're starting or ending a backticked block
    else if (line.startsWith("```") && !backtickStartingLineToIgnore(line)) {
      // The line is fine as is, but we need to toggle in or out of the backticks
      lines.push(line);
      backtickedBlock = !backtickedBlock;
      // If we're in a backticked block
    } else if (backtickedBlock) {
      lines.push(line);
      // No code block at all
    } else {
      // HTML escape the line, but unescape anything in backticks
      lines.push(
        escape(line).replace(/`(.+?)`/g, (match, p1) => `\`${unescape(p1)}\``)
      );
    }
  });

  if (tabbedBlock) lines.push("```");

  return lines.join("\n").replaceAll("\n\n```", "\n```");
}

const globalScopeInternal = "";
const globalScopeConfigSection = "GLOBAL";

/** Split `string` at the first instance of `sep`, e.g. string = "a,b,c", sep = , => ["a", "b,c"] */
function splitFirst(string, sep) {
  // Emulate `string.split(sep, 1)` in Python, because that exact code in JS has the wrong
  // behaviour if `sep` appears more than once: the trailing info is dropped (example above
  // returns ["a", "b"], without the ",c").
  const firstIndex = string.indexOf(sep);
  return firstIndex === -1
    ? [string]
    : [string.slice(0, firstIndex), string.slice(firstIndex + sep.length)];
}

/** Return a representation of arg value from the CLI. */
function deduceArgValue(displayArgs, envVar) {
  const exampleCli = displayArgs[0];

  const val = exampleCli.includes("[no-]")
    ? "<bool>"
    : splitFirst(exampleCli, "=")[1];

  if (val) {
    return val;
  }

  const args = JSON.stringify(displayArgs);
  throw new Error(
    `In ${envVar}, failed to deduce value formatting from example CLI instances: ${args}`
  );
}

function generateTomlRepr(option, scope) {
  // Generate a toml block for the option to help users fill out their `pants.toml`.  For
  // scalars and arrays, we put them inline directly in the scope, while for maps we put
  // them in a nested table. Since the metadata doesn't contain type info, we'll need to
  // parse command line args a bit.

  const configKey = option.config_key;
  if (!configKey) {
    // This options is not configurable
    return "";
  }

  if (scope === globalScopeInternal) {
    // make sure we're rendering with the section name as appears in pants.toml
    scope = globalScopeConfigSection;
  }

  const tomlLines = [];
  const val = deduceArgValue(option.display_args, option.env_var);

  const isMap = val.startsWith('"{') && val.endsWith('}"');
  const isArray = val.startsWith('"[') && val.endsWith(']"');

  if (isMap) {
    tomlLines.push(`[${scope}.${configKey}]`);

    const pairs = val.slice(2, -2).split(", ");
    for (const pair of pairs) {
      if (pair.includes(":")) {
        let [k, v] = splitFirst(pair, ": ");
        if (k.startsWith('"') || k.startsWith("'")) {
          k = k.slice(1, -1);
        }
        tomlLines.push(`${k} = ${v}`);
      } else {
        // generally just the trailing ...
        tomlLines.push(pair);
      }
    }
  } else if (isArray) {
    tomlLines.push(`[${scope}]`, `${configKey} = [`);
    for (const item of val.slice(2, -2).split(", ")) {
      tomlLines.push(`    ${item},`);
    }
    tomlLines.push("]");
  } else {
    tomlLines.push(`[${scope}]`, `${configKey} = ${val}`);
  }

  return tomlLines.join("\n");
}

let buildroot = "";
let cachedir = "";
helpAll.scope_to_help_info[globalScopeInternal].advanced.forEach((option) => {
  if (option.config_key === "pants_distdir") {
    buildroot = option.default.split("/").slice(0, -1).join("/");
  }
  if (option.config_key === "local_store_dir") {
    cachedir = option.default.split("/").slice(0, -2).join("/");
  }
});
helpAll.scope_to_help_info[""].basic.forEach((option) => {
  // NB: The default changes depending on the environment, so hardcode.
  if (option.config_key === "dynamic_ui") {
    option.default = true;
  }
});

Object.entries(helpAll.scope_to_help_info).forEach(([scope, info]) => {
  info.description = convertDescription(info.description);
  info.short_description = info.description.split("\n")[0];

  if (scope === "environments-preview") {
    // NB: Workaround a bug in Pants' generation.
    // See https://github.com/pantsbuild/pantsbuild.org/pull/128#discussion_r1454429425
    info.provider = "pants.core";
  }

  ["basic", "advanced", "deprecated"].forEach((optionsType) => {
    info[optionsType].forEach((option) => {
      option.default = convertDefault(option.default, option.typ);
      option.help = convertDescription(option.help);
      if (option.removal_hint !== null) {
        option.removal_hint = option.removal_hint
          .replaceAll("\n", "<br />")
          .replaceAll("'", "\\'");
      }
      option.toml_repr = generateTomlRepr(option, scope);
    });

    // sort the options to make the output deterministic
    info[optionsType].sort((a, b) => a.config_key.localeCompare(b.config_key));
  });
});

Object.entries(helpAll.name_to_target_type_info).forEach(([name, info]) => {
  info.fields.forEach((field) => {
    if (!field.required) {
      field.default = convertDefault(field.default, field.typ);
    } else {
      field.default = null;
    }
    field.description = convertDescription(field.description);
  });

  // sort the fields to make the output deterministic
  info.fields.sort((a, b) => {
    if (a.required == b.required) {
      return a.alias.localeCompare(b.alias);
    }

    // sort required fields first
    if (a.required && !b.required) return -1;
    if (!a.required && b.required) return 1;
  });
});

["goals", "subsystems", "targets", "build-file-symbols"].forEach((name) =>
  ensureEmptyDirectory(name)
);

await Promise.all([
  // Global Options
  writeFile(
    "global-options.mdx",
    renderSubsystemTemplate(
      {
        ...helpAll["scope_to_help_info"][globalScopeInternal],
        sidebar_position: 1,
      },
      helpAll
    )
  ),
  // Subsystems
  ...Object.entries(helpAll.scope_to_help_info).map(async ([scope, info]) => {
    if (scope === globalScopeInternal) return;
    const parent = info.is_goal ? "goals" : "subsystems";
    await writeFile(
      path.join(parent, `${info.scope}.mdx`),
      renderSubsystemTemplate(info, helpAll)
    );
  }),

  // Targets
  ...Object.entries(helpAll.name_to_target_type_info).map(
    async ([name, info]) => {
      if (info.alias.startsWith("_")) return;

      info.description = convertDescription(info.description);
      info.short_description = info.description.split("\n")[0];
      await writeFile(
        path.join("targets", `${info.alias}.mdx`),
        renderTargetTemplate(info)
      );
    }
  ),
  // BUILD file symbols (NB. targets are also included, so need to be explicitly removed).
  helpAll.name_to_build_file_info &&
    Object.values(helpAll.name_to_build_file_info).map(async (info) => {
      if (info.is_target) return;

      info.short_documentation = info.documentation?.split("\n")?.[0];
      info.documentation =
        info.documentation && convertDescription(info.documentation);

      await writeFile(
        path.join("build-file-symbols", `${info.name}.mdx`),
        renderBuildFileSymbolTemplate(info)
      );
    }),
  // `_category_.json` files
  writeFile(
    "goals/_category_.json",
    JSON.stringify({
      label: "Goals",
      link: {
        type: "generated-index",
        slug: "/reference/goals",
        title: "Goals",
      },
      position: 2,
    })
  ),
  writeFile(
    "subsystems/_category_.json",
    JSON.stringify({
      label: "Subsystems",
      link: {
        type: "generated-index",
        slug: "/reference/subsystems",
        title: "Subsystems",
      },
      position: 3,
    })
  ),
  writeFile(
    "targets/_category_.json",
    JSON.stringify({
      label: "Targets",
      link: {
        type: "generated-index",
        slug: "/reference/targets",
        title: "Targets",
      },
      position: 4,
    })
  ),
  helpAll.name_to_build_file_info &&
    writeFile(
      "build-file-symbols/_category_.json",
      JSON.stringify({
        label: "BUILD file symbols",
        link: {
          type: "generated-index",
          slug: "/reference/build-file-symbols",
          title: "BUILD file symbols",
        },
        position: 5,
      })
    ),
]);
