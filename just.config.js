// @ts-check
const path = require("path");
const { argv, series, task, tscTask } = require("just-scripts");
const {
  bundleTask,
  cleanTask,
  coreLint,
  mcaddonTask,
  setupEnvironment,
  getOrThrowFromProcess,
  DEFAULT_CLEAN_DIRECTORIES,
} = require("@minecraft/core-build-tasks");

setupEnvironment(path.resolve(__dirname, ".env"));
const projectName = getOrThrowFromProcess("PROJECT_NAME");
const isProduction = Boolean(argv()["production"]);

/** @type {import("@minecraft/core-build-tasks").BundleTaskParameters} */
const bundleOptions = {
  entryPoint: path.join(__dirname, "scripts/main.ts"),
  external: ["@minecraft/server", "@minecraft/server-ui"],
  outfile: path.resolve(__dirname, "dist/scripts/main.js"),
  minifyWhitespace: isProduction,
  sourcemap: !isProduction,
  outputSourcemapPath: path.resolve(__dirname, "dist/debug"),
  dropLabels: isProduction ? ["dev"] : undefined,
};

/** @type {import("@minecraft/core-build-tasks").ZipTaskParameters} */
const mcaddonOptions = {
  copyToBehaviorPacks: [`./behavior_packs/${projectName}`],
  copyToScripts: ["./dist/scripts"],
  copyToResourcePacks: [`./resource_packs/${projectName}`],
  outputFile: `./dist/packages/${projectName}.mcaddon`,
};

task("lint", coreLint(["scripts/**/*.ts"], argv().fix));

task("typescript", tscTask());
task("bundle", bundleTask(bundleOptions));
task("build", series("typescript", "bundle"));

task("clean", cleanTask(DEFAULT_CLEAN_DIRECTORIES));

task("createMcaddonFile", mcaddonTask(mcaddonOptions));
task("mcaddon", series("clean", "build", "createMcaddonFile"));
