// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { join } = require("node:path");
const fs = require("fs-extra");
const { execSync } = require("node:child_process");
const { glob } = require("glob");

const WORK_DIR_NAME = "_electron";

module.exports = setup;

/**
 * @param {string} projectRoot
 */
function setup(projectRoot) {
  const workDir = join(projectRoot, WORK_DIR_NAME);
  const compileDir = join(projectRoot, "_compile");
  if(!fs.existsSync(compileDir)) {
    throw "No directory for compiled files found. Please run 'npm run build' before this command.";
  }

  if(fs.existsSync(workDir)) {
    fs.rmSync(workDir, {recursive: true});
  }
  fs.mkdirSync(workDir);
  fs.copySync(compileDir, join(workDir, "_compile"));
  fs.copySync(join(projectRoot, "package-lock.json"), join(workDir, "package-lock.json"));
  fs.writeFileSync(join(workDir, "package.json"), JSON.stringify(mergePackageJsons(projectRoot), null, 2), {encoding: "utf-8"});
  execSync(`npm --prefix ${WORK_DIR_NAME} install`);
  return workDir;
}

function mergePackageJsons(rootPath) {
  /** @type {PackageJSON[]} */
  const packageJSONs = [];
  const packageJSONPaths = glob.sync("**/package.json", {cwd: "./project", ignore: "**/node_modules/**"});
  for(const packageJsonPath of packageJSONPaths) {
    const json = readPackageJson(rootPath, "project", packageJsonPath);
    packageJSONs.push(json);
  }
  const rootPackageJson = readPackageJson(rootPath, "package.json");
  const mergedJson = deepMergeJson(...packageJSONs, rootPackageJson);
  mergedJson.scripts["postinstall"] = "electron-builder install-app-deps";
  return mergedJson;
}

/**
 * @param {...string} pathSegments
 * @returns {PackageJSON}
 */
function readPackageJson(...pathSegments) {
  const path = join(...pathSegments);
  if(!fs.existsSync(path)) {
    throw new Error("Found no package.json at " + pathSegments.join("/"));
  }
  const content = fs.readFileSync(path, {encoding: "utf-8"});
  return JSON.parse(content);
}


/**
 * @param  {...PackageJSON} jsons
 * @returns {PackageJSON}
 */
function deepMergeJson(...jsons) {
  return jsons.reduce((acc, curr) => {
    curr["dependencies"] = {...(acc["dependencies"] ?? {}),         ...(curr["dependencies"] ?? {})};
    curr["devDependencies"] = {...(acc["devDependencies"] ?? {}),   ...(curr["devDependencies"] ?? {})};
    curr["peerDependencies"] = {...(acc["peerDependencies"] ?? {}), ...(curr["peerDependencies"] ?? {})};
    return curr;
  });
}

/**
 * Represents a package.json configuration.
 * @typedef {Object} PackageJSON
 * @property {string} name - The name of the package.
 * @property {string} version - The version of the package.
 * @property {string} description - A brief description of the package.
 * @property {string[]} keywords - An array of keywords describing the package.
 * @property {string} main - The entry point of the package.
 * @property {string} [license] - The license for the package (optional).
 * @property {Object.<string, string>} scripts - A collection of npm scripts.
 * @property {Object.<string, string>} dependencies - The dependencies required by the package.
 * @property {Object.<string, string>} devDependencies - The development dependencies required by the package.
 * @property {Object.<string, string>} peerDependencies - The peer dependencies required by the package.
 * @property {Object.<string, string>} [optionalDependencies] - The optional dependencies of the package (optional).
 * @property {string} [repository] - The repository where the package's source code lives (optional).
 * @property {string} [homepage] - The URL to the package's homepage (optional).
 * @property {Object.<string, string>} [author] - The author of the package (optional).
 * @property {Object.<string, string>} [contributors] - The contributors to the package (optional).
 * @property {Object.<string, string>} [bugs] - The URL to the issue tracker for the package (optional).
 */
