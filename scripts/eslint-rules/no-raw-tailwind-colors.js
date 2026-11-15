/* Local ESLint 8 rule; loaded by scripts/eslint-semantic-colors.cjs. */
const palette = "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const utilities = "bg|text|border(?:-[xytrblse])?|divide|ring(?:-offset)?|outline|shadow|accent|caret|fill|stroke|decoration|placeholder|from|via|to";
const rawColor = new RegExp(`^!?(?:${utilities})-(?:(?:${palette})-(?:50|[1-9]00|950)|black|white)(?:\\/(?:\\d+(?:\\.\\d+)?|\\[[^\\]]+\\]))?!?$`);

// Colons within an arbitrary selector/value are not variant separators.
function baseUtility(token) {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i += 1) {
    if (token[i] === "\\") { i += 1; continue; }
    if (token[i] === "[" || token[i] === "(") depth += 1;
    else if (token[i] === "]" || token[i] === ")") depth -= 1;
    else if (token[i] === ":" && depth === 0) start = i + 1;
  }
  return token.slice(start);
}

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Require semantic colors instead of Tailwind's built-in palette in class names" },
    schema: [],
    messages: {
      rawColor: "Use a semantic color token or existing semantic CSS class instead of '{{token}}'. See docs/COLOR_TOKENS.md.",
    },
  },
  create(context) {
    const sourceCode = context.getSourceCode();
    function inspectText(node, value) {
      for (const token of value.split(/\s+/)) {
        if (rawColor.test(baseUtility(token))) {
          context.report({ node, messageId: "rawColor", data: { token } });
        }
      }
    }
    function inspectExpression(node) {
      if (!node) return;
      if (node.type === "Literal" && typeof node.value === "string") {
        inspectText(node, node.value);
        return;
      }
      if (node.type === "TemplateElement") {
        inspectText(node, node.value.cooked ?? node.value.raw);
        return;
      }
      // Traverse only the className expression, including inline conditionals,
      // arrays and clsx/classnames object keys. Never scan unrelated prose/URLs.
      for (const key of sourceCode.visitorKeys[node.type] || []) {
        const child = node[key];
        if (Array.isArray(child)) child.forEach(inspectExpression);
        else if (child && typeof child.type === "string") inspectExpression(child);
      }
    }
    return {
      JSXAttribute(node) {
        if (node.name.type === "JSXIdentifier" && ["className", "class"].includes(node.name.name)) {
          inspectExpression(node.value);
        }
      },
    };
  },
};
