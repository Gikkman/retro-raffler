// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
const { join, relative } = require("node:path");
const setup = require("./electron-builder.setup");

/**
 * This ain't pretty, but electron-builder has a strange quirk where it needs to be
 * executed from the directory that has a package.json containing all production
 * dependencies. And I don't want all electron-builder related stuff to be located
 * in the root of the project, or in the backend project.
 */
const projectRoot = join(__dirname, "..", "..");
const cwd = setup(projectRoot);
const hereUrl = relative(cwd, __dirname);
process.chdir(cwd);

const root = (...s) => join(projectRoot, ...s);
const here = (...s) => join(hereUrl, ...s);

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {
  asar: true,
  appId: "com.gikkman.retro-raffler",
  productName: "Retro Raffler",
  win: {
    target: [
      "zip"
    ],
    icon: here("assets/win.ico")
  },
  mac: {
    icon: here("assets/mac.icns")
  },
  directories: {
    buildResources: here("assets"),
    output: root("_package")
  },
  files: [
    root("_compile")
  ],
  extraMetadata: {
    main: root("_compile/electron/main.js")
  },
  extraResources: [
    root("lua/*"),
  ]
};

module.exports = config;
