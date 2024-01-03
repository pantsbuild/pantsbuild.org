const Mustache = require("mustache");
const fs = require("fs");
const path = require("path");
const he = require("he");

const reference_dir = path.join(process.argv[2], "reference");
const helpAll = JSON.parse(
  fs.readFileSync(path.join(reference_dir, "help-all.json"), "utf8")
);
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

function renderSubsystemTemplate(view) {
  return Mustache.render(subsystemTemplate, view, { option: optionTemplate });
}

function renderTargetTemplate(view) {
  return Mustache.render(targetTemplate, view, { field: fieldTemplate });
}

function convertDefault(val, type) {
  if (Array.isArray(val) || typeof val === "object") {
    if (val && Object.keys(val).length === 1) {
      return JSON.stringify(val, Object.keys(val).sort(), 2);
    }
    if (val === null) return "None";
    return JSON.stringify(val, null, 2).replace(/\n/g, "\\n");
  }
  if (val === true) return "True";
  if (val === false) return "False";
  if (type === "float" && Number.isInteger(val)) return String(val) + ".0";

  return String(val)
    .replace(buildroot, "<buildroot>")
    .replace(cachedir, "$XDG_CACHE_HOME")
    .replace(/\\n/g, "\\\\n");
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
    if (!tabbedBlock && line.startsWith("    ") && !backtickedBlock) {
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

  return lines.join("\n").replace("\n\n```", "\n```");
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

fs.mkdirSync(reference_dir, { recursive: true });
process.chdir(reference_dir);
fs.mkdirSync("goals", { recursive: true });
fs.mkdirSync("subsystems", { recursive: true });
fs.mkdirSync("targets", { recursive: true });

// Global Options
fs.writeFileSync(
  "global-options.mdx",
  renderSubsystemTemplate(helpAll["scope_to_help_info"][""])
);

// Subsystems
Object.entries(helpAll.scope_to_help_info).forEach(([scope, info]) => {
  if (scope === "") return;

  info.description = convertDescription(info.description);
  const parent = info.is_goal ? "goals" : "subsystems";
  fs.writeFileSync(
    path.join(parent, `${info.scope}.mdx`),
    renderSubsystemTemplate(info)
  );
});

// Targets
Object.entries(helpAll.name_to_target_type_info).forEach(([name, info]) => {
  if (info.alias.startsWith("_")) return;

  info.description = convertDescription(info.description);
  fs.writeFileSync(
    path.join("targets", `${info.alias}.mdx`),
    renderTargetTemplate(info)
  );
});

// `_category_.json` files
fs.writeFileSync(
  "goals/_category_.json",
  '{\n  "label": "Goals",\n  "link": {\n    "type": "generated-index",\n    "slug": "/reference/goals",    "title": "Goals"\n  }}\n'
);
fs.writeFileSync(
  "subsystems/_category_.json",
  '{\n  "label": "Subsystems",\n  "link": {\n    "type": "generated-index",\n    "slug": "/reference/subsystems",    "title": "Subsystems"\n  }}\n'
);
fs.writeFileSync(
  "targets/_category_.json",
  '{\n  "label": "Targets",\n  "link": {\n    "type": "generated-index",\n    "slug": "/reference/targets",\n    "title": "Targets"\n  }}\n'
);
