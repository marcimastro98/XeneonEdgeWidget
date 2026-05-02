#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(repoRoot, "widget");
const buildRoot = join(tmpdir(), `xenonedgehub-icue-package-${process.pid}`);
const buildDir = join(buildRoot, "xenonedgehub");
const packageOutput = join(repoRoot, "xenonedgehub.icuewidget");

const copiedPaths = [
  "manifest.json",
  "translation.json",
  "resources",
  "styles",
  "modules",
  "common"
];

function readSource(relativePath) {
  return readFileSync(join(sourceDir, relativePath), "utf8");
}

function resolveComponentMarkup(markup) {
  return markup.replace(/<div data-component-path="([^"]+)"><\/div>/g, (_match, componentPath) => {
    return resolveComponentMarkup(readSource(componentPath).trim());
  });
}

function createBundledIndex() {
  const dashboardMarkup = resolveComponentMarkup(readSource("components/dashboard.html").trim());
  const overlayMarkup = resolveComponentMarkup(readSource("components/overlays.html").trim());
  const sourceIndex = readSource("index.html");
  const runtimeMount = [
    `<div id="xenonedge-root">`,
    dashboardMarkup,
    `</div>`,
    `<div id="xenonedge-overlays">`,
    overlayMarkup,
    `</div>`,
    `<script src="modules/app.js"></script>`
  ].join("\n");

  const bundledIndex = sourceIndex.replace(
    /<div id="xenonedge-root"><\/div>\s*<div id="xenonedge-overlays"><\/div>\s*<script src="modules\/components\/loader\.js"><\/script>/,
    runtimeMount
  );

  if (bundledIndex === sourceIndex) {
    throw new Error("Could not find the component loader mount point in index.html");
  }
  if (bundledIndex.includes("data-component-path")) {
    throw new Error("Bundled index still contains unresolved component placeholders");
  }

  return bundledIndex;
}

function run(command, args) {
  const executable = process.platform === "win32" && command === "icuewidget"
    ? "icuewidget.exe"
    : command;
  const result = spawnSync(executable, args, {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
}

function prepareBuildDirectory() {
  rmSync(buildRoot, { recursive: true, force: true });
  mkdirSync(buildDir, { recursive: true });

  for (const relativePath of copiedPaths) {
    cpSync(join(sourceDir, relativePath), join(buildDir, relativePath), { recursive: true });
  }

  rmSync(join(buildDir, "modules", "components"), { recursive: true, force: true });
  writeFileSync(join(buildDir, "index.html"), createBundledIndex(), "utf8");
}

// iCUE import dialog expects files inside a subfolder named after the widget ID.
// After icuewidget package creates the flat zip, we repackage with the correct structure.
function repackWithSubfolder(zipPath, widgetId) {
  const manifest = JSON.parse(readFileSync(join(sourceDir, "manifest.json"), "utf8"));
  const folderId = manifest.id || widgetId;

  const psScript = `
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$src = '${zipPath.replace(/\\/g, "\\\\")}'; $tmp = $src + '.tmp'
$rdr = [System.IO.Compression.ZipFile]::Open($src, 'Read')
$wtr = [System.IO.Compression.ZipFile]::Open($tmp, 'Create')
foreach ($e in $rdr.Entries) {
  $newName = '${folderId}/' + $e.FullName
  $dst = $wtr.CreateEntry($newName, 'Optimal')
  $si = $e.Open(); $di = $dst.Open(); $si.CopyTo($di); $si.Close(); $di.Close()
}
$rdr.Dispose(); $wtr.Dispose()
Remove-Item $src -Force; Rename-Item $tmp $src
Write-Host 'Repackaged with subfolder: ${folderId}/'
`.trim();

  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", psScript], {
    cwd: repoRoot,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    throw new Error("Repackaging with subfolder structure failed");
  }
}

try {
  if (!existsSync(sourceDir)) throw new Error("widget source directory was not found");
  prepareBuildDirectory();
  run("icuewidget", ["validate", buildDir]);
  run("icuewidget", ["package", buildDir, "--output", packageOutput]);
  repackWithSubfolder(packageOutput, "com.marcimastro98.xenonedgehub");
} finally {
  if (!process.env.KEEP_ICUE_BUILD) {
    rmSync(buildRoot, { recursive: true, force: true });
  }
}
