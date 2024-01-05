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

let buildroot = "";
let cachedir = "";
helpAll.scope_to_help_info[""].advanced.forEach((option) => {
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

// Global Options
await writeFile(
  "global-options.mdx",
  renderSubsystemTemplate(helpAll["scope_to_help_info"][""], helpAll)
);

// Subsystems
await Promise.all(
  Object.entries(helpAll.scope_to_help_info).map(async ([scope, info]) => {
    if (scope === "") return;

    info.description = convertDescription(info.description);
    const parent = info.is_goal ? "goals" : "subsystems";
    await writeFile(
      path.join(parent, `${info.scope}.mdx`),
      renderSubsystemTemplate(info, helpAll)
    );
  })
);

// Targets
await Promise.all(
  Object.entries(helpAll.name_to_target_type_info).map(async ([name, info]) => {
    if (info.alias.startsWith("_")) return;

    info.description = convertDescription(info.description);
    await writeFile(
      path.join("targets", `${info.alias}.mdx`),
      renderTargetTemplate(info)
    );
  })
);

// `_category_.json` files
await writeFile(
  "goals/_category_.json",
  JSON.stringify({
    label: "Goals",
    link: { type: "generated-index", slug: "/reference/goals", title: "Goals" },
  })
);
await writeFile(
  "subsystems/_category_.json",
  JSON.stringify({
    label: "Subsystems",
    link: {
      type: "generated-index",
      slug: "/reference/subsystems",
      title: "Subsystems",
    },
  })
);
await writeFile(
  "targets/_category_.json",
  JSON.stringify({
    label: "Targets",
    link: {
      type: "generated-index",
      slug: "/reference/targets",
      title: "Targets",
    },
  })
);
