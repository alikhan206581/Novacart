const { spawnSync } = require("node:child_process");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const clientPackage = path.dirname(require.resolve("@prisma/client"));
const modulesRoot = path.resolve(clientPackage, "..", "..");
const prismaCli = path.join(modulesRoot, "prisma", "build", "index.js");
const result = spawnSync(process.execPath, [
  prismaCli,
  ...process.argv.slice(2),
  "--schema",
  path.resolve(projectRoot, "../backend/prisma/schema.prisma"),
], {
  cwd: projectRoot,
  env: {
    ...process.env,
    PRISMA_CLIENT_OUTPUT: path.resolve(clientPackage, "..", "..", ".prisma", "client"),
  },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status === null ? 1 : result.status);
