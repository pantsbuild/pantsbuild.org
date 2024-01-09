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

  return val
    .replace(buildroot, "<buildroot>")
    .replace(cachedir, "$XDG_CACHE_HOME");
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
    // We're _not_ in a tabbed block
    else {
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
  const exampleCli = option.display_args[0];

  const val = exampleCli.includes("[no-]")
    ? "<bool>"
    : splitFirst(exampleCli, "=")[1];

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
  if (option.config_key === "pants_workdir") {
    buildroot = option.default.split("/").slice(0, -2).join("/");
  }
  if (option.config_key === "local_store_dir") {
    cachedir = option.default.split("/").slice(0, -2).join("/");
  }
});

Object.entries(helpAll.scope_to_help_info).forEach(([scope, info]) => {
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
  });
});
Object.entries(helpAll.name_to_target_type_info).forEach(([name, info]) => {
  info.fields.forEach((field) => {
    field.default = convertDefault(field.default, field.typ);
    field.description = convertDescription(field.description);
  });
});

["goals", "subsystems", "targets"].forEach((name) =>
  ensureEmptyDirectory(name)
);

await Promise.all([
  // Global Options
  writeFile(
    "global-options.mdx",
    renderSubsystemTemplate(helpAll["scope_to_help_info"][""], helpAll)
  ),
  // Subsystems
  ...Object.entries(helpAll.scope_to_help_info).map(async ([scope, info]) => {
    if (scope === "") return;

    info.description = convertDescription(info.description);
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
      await writeFile(
        path.join("targets", `${info.alias}.mdx`),
        renderTargetTemplate(info)
      );
    }
  ),
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
    })
  ),
]);
