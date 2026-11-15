/* eslint-disable @typescript-eslint/no-require-imports */
const { describe, it } = require("node:test");
const { RuleTester } = require("eslint");
const rule = require("../../scripts/eslint-rules/no-raw-tailwind-colors");

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
});
const error = { messageId: "rawColor" };

tester.run("no-raw-tailwind-colors", rule, {
  valid: [
    '<div className="bg-paper text-ink border-action" />',
    '<div className="button-primary badge-danger text-sm bg-transparent text-current border-inherit" />',
    '<div className={active ? "badge-success" : "badge-warning"} />',
    '<div className={`card ${active ? "button-primary" : "button-secondary"}`} />',
    '<div className={styles.card} />',
    'const description = "Use bg-red-50 for this example"; const url = "https://example.com/text-gray-700";',
    '<a href="https://example.com/bg-red-50" title="bg-red-50">text-gray-700</a>',
    '<div className="some-bg-red-50 text-gray-700-custom bg-brand-500 [background:var(--action)]" />',
    '<div className="bg-[url(https://example.com/bg-red-50)]" />',
  ],
  invalid: [
    { code: '<div className="bg-red-50 text-gray-700 border-blue-300" />', errors: [error, error, error] },
    { code: '<div class="text-red-500" />', errors: [error] },
    { code: '<div className={"sm:hover:bg-red-50/50"} />', errors: [error] },
    { code: '<div className={`flex bg-red-50 ${extra} dark:text-gray-700`} />', errors: [error, error] },
    { code: '<div className={active ? "bg-red-50" : "bg-paper"} />', errors: [error] },
    { code: '<div className={active && "border-blue-300"} />', errors: [error] },
    { code: '<div className={clsx("card", { "hover:text-gray-700": active })} />', errors: [error] },
    { code: '<div className={["card", "text-gray-700"].join(" ")} />', errors: [error] },
    { code: '<div className="[&:nth-child(2)]:!bg-red-50/[.35] supports-[display:grid]:border-x-blue-300" />', errors: [error, error] },
    { code: '<div className="dark:group-hover:ring-offset-slate-950 fill-white stroke-black from-rose-500 via-sky-500 to-indigo-900" />', errors: [error, error, error, error, error, error] },
    { code: '<div className="focus-visible:placeholder-gray-400 hover:decoration-blue-500 shadow-neutral-900/20" />', errors: [error, error, error] },
  ],
});
