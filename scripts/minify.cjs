// Production Minification Script (Phase 5 - Item 33)
// Runs esbuild to generate minified CSS & JS production bundles.
const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
console.log("Minifying CSS & JS bundles with esbuild...");

try {
  execSync("npx --yes esbuild orc-styles.css --minify --outfile=orc-styles.min.css", { cwd: root, stdio: "inherit" });
  execSync("npx --yes esbuild orc-script.js --minify --outfile=orc-script.min.js", { cwd: root, stdio: "inherit" });
  console.log("Successfully produced orc-styles.min.css and orc-script.min.js");
} catch (err) {
  console.error("Minification failed:", err);
  process.exit(1);
}
