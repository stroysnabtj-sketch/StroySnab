/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const { ESLint } = require("eslint");

async function main() {
  const eslint = new ESLint({
    cwd: path.resolve(__dirname, ".."),
    useEslintrc: true,
    rulePaths: [path.join(__dirname, "eslint-rules")],
    overrideConfig: { rules: { "no-raw-tailwind-colors": "error" } },
  });
  const results = await eslint.lintFiles(["src/**/*.{js,jsx,ts,tsx}"]);
  const formatter = await eslint.loadFormatter("stylish");
  const output = formatter.format(results);
  if (output) process.stdout.write(output);
  if (results.some((result) => result.errorCount > 0 || result.warningCount > 0)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
