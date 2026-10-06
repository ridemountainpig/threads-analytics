// Rehype plugin for the MDX article bodies in content/. next.config.ts loads
// it by absolute path, because Turbopack only accepts serializable plugin
// options.
//
// - Gives every h2 and h3 an id, so sections can be linked to.
// - Exports those headings from the compiled module as
//   `export const headings = [{ depth, id, text }]`, which the pages read for
//   outlines and tables of contents instead of parsing the file again.
// - Turns the first cell of each table body row into a row header and scopes
//   the head cells, matching the tables the guides rendered before MDX.

// Word joiners keep CJK headings from breaking mid-word (see the guide copy);
// they stay in the heading text but not in ids.
const INVISIBLE = /[​-‍⁠﻿]/g;

function textOf(node) {
  if (node.type === "text") return node.value;
  return (node.children ?? []).map(textOf).join("");
}

function slugify(text) {
  return text
    .replace(INVISIBLE, "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function isElement(node, tagName) {
  return node.type === "element" && node.tagName === tagName;
}

function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

function toEstree(value) {
  if (Array.isArray(value)) {
    return { type: "ArrayExpression", elements: value.map(toEstree) };
  }
  if (value !== null && typeof value === "object") {
    return {
      type: "ObjectExpression",
      properties: Object.entries(value).map(([key, item]) => ({
        type: "Property",
        kind: "init",
        method: false,
        shorthand: false,
        computed: false,
        key: { type: "Identifier", name: key },
        value: toEstree(item),
      })),
    };
  }
  return { type: "Literal", value };
}

export default function rehypeArticle() {
  return (tree) => {
    const headings = [];
    const usedIds = new Map();

    walk(tree, (node) => {
      if (isElement(node, "h2") || isElement(node, "h3")) {
        const text = textOf(node).trim();
        const base = slugify(text) || "section";
        const count = usedIds.get(base) ?? 0;
        usedIds.set(base, count + 1);
        const id = count === 0 ? base : `${base}-${count}`;
        node.properties = { ...node.properties, id };
        headings.push({ depth: Number(node.tagName[1]), id, text });
      } else if (isElement(node, "thead")) {
        walk(node, (cell) => {
          if (isElement(cell, "th")) cell.properties = { ...cell.properties, scope: "col" };
        });
      } else if (isElement(node, "tbody")) {
        for (const row of node.children.filter((child) => isElement(child, "tr"))) {
          const first = row.children.find((child) => child.type === "element");
          if (first && first.tagName === "td") {
            first.tagName = "th";
            first.properties = { ...first.properties, scope: "row" };
          }
        }
      }
    });

    tree.children.push({
      type: "mdxjsEsm",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ExportNamedDeclaration",
              specifiers: [],
              source: null,
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name: "headings" },
                    init: toEstree(headings),
                  },
                ],
              },
            },
          ],
        },
      },
    });
  };
}
