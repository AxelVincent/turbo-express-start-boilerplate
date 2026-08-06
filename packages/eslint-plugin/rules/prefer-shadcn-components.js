/**
 * @fileoverview Disallow native HTML elements when a shadcn equivalent exists.
 *
 * The shadcn library in `src/components/ui/` provides styled, accessible
 * primitives (Input, Textarea, Button, Label, Select, Checkbox, RadioGroup,
 * Progress, Table…). Using the native element bypasses our design system and
 * produces inconsistent UI. This rule flags those usages and points at the
 * shadcn replacement to use instead.
 *
 * The rule does not run inside `src/components/ui/**` itself — those files
 * are the shadcn primitives and necessarily render the underlying native
 * element.
 */

"use strict"

const TABLE_FROM = "@/components/ui/table"

const MAPPINGS = {
  input: { component: "Input", from: "@/components/ui/input" },
  textarea: { component: "Textarea", from: "@/components/ui/textarea" },
  button: { component: "Button", from: "@/components/ui/button" },
  select: { component: "Select", from: "@/components/ui/select" },
  label: { component: "Label", from: "@/components/ui/label" },
  progress: { component: "Progress", from: "@/components/ui/progress" },
  table: { component: "Table", from: TABLE_FROM },
  thead: { component: "TableHeader", from: TABLE_FROM },
  tbody: { component: "TableBody", from: TABLE_FROM },
  tfoot: { component: "TableFooter", from: TABLE_FROM },
  tr: { component: "TableRow", from: TABLE_FROM },
  td: { component: "TableCell", from: TABLE_FROM },
  th: { component: "TableHead", from: TABLE_FROM },
}

const INPUT_TYPE_MAPPINGS = {
  checkbox: { component: "Checkbox", from: "@/components/ui/checkbox" },
  radio: { component: "RadioGroup", from: "@/components/ui/radio-group" },
}

function getInputType(node) {
  for (const attr of node.attributes) {
    if (
      attr.type === "JSXAttribute" &&
      attr.name &&
      attr.name.name === "type" &&
      attr.value &&
      attr.value.type === "Literal" &&
      typeof attr.value.value === "string"
    ) {
      return attr.value.value
    }
  }
  return null
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow native HTML elements when a shadcn equivalent exists in `@/components/ui/`",
      recommended: false,
    },
    messages: {
      preferShadcn:
        "Use `{{ component }}` from `{{ from }}` instead of native `<{{ tag }}>`. " +
        "Native HTML elements bypass the design system.",
    },
    schema: [],
  },

  create(context) {
    const filename = context.getFilename().replace(/\\/g, "/")

    if (filename.includes("/src/components/ui/")) {
      return {}
    }

    return {
      JSXOpeningElement(node) {
        if (node.name.type !== "JSXIdentifier") return

        const tag = node.name.name
        const mapping = MAPPINGS[tag]
        if (!mapping) return

        let target = mapping
        if (tag === "input") {
          const inputType = getInputType(node)
          if (inputType && INPUT_TYPE_MAPPINGS[inputType]) {
            target = INPUT_TYPE_MAPPINGS[inputType]
          }
        }

        context.report({
          node: node.name,
          messageId: "preferShadcn",
          data: {
            tag,
            component: target.component,
            from: target.from,
          },
        })
      },
    }
  },
}
