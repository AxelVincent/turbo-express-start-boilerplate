/**
 * @fileoverview Tests for prefer-shadcn-components rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./prefer-shadcn-components")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
})

ruleTester.run("prefer-shadcn-components", rule, {
  valid: [
    // ── Shadcn components themselves are exempt ──
    {
      code: `function Input() { return <input type="text" />; }`,
      filename: "/src/components/ui/input.tsx",
    },
    {
      code: `function Table() { return <table><thead><tr><th /></tr></thead></table>; }`,
      filename: "/src/components/ui/table.tsx",
    },
    // ── Using the shadcn component is fine ──
    {
      code: `import { Input } from '@/components/ui/input'; const X = () => <Input />;`,
      filename: "/src/components/features/foo.tsx",
    },
    // ── Unmapped native elements are fine ──
    {
      code: `const X = () => <div><span /><p>hi</p></div>;`,
      filename: "/src/components/features/foo.tsx",
    },
    // ── <form> isn't mapped (shadcn Form is a different abstraction) ──
    {
      code: `const X = () => <form><div /></form>;`,
      filename: "/src/components/features/foo.tsx",
    },
  ],

  invalid: [
    // ── Native <input> ──
    {
      code: `const X = () => <input type="text" />;`,
      filename: "/src/components/features/foo.tsx",
      errors: [
        {
          messageId: "preferShadcn",
          data: {
            tag: "input",
            component: "Input",
            from: "@/components/ui/input",
          },
        },
      ],
    },
    // ── <input type="checkbox"> dispatches to Checkbox ──
    {
      code: `const X = () => <input type="checkbox" />;`,
      filename: "/src/components/features/foo.tsx",
      errors: [
        {
          messageId: "preferShadcn",
          data: {
            tag: "input",
            component: "Checkbox",
            from: "@/components/ui/checkbox",
          },
        },
      ],
    },
    // ── <input type="radio"> dispatches to RadioGroup ──
    {
      code: `const X = () => <input type="radio" name="x" />;`,
      filename: "/src/components/features/foo.tsx",
      errors: [
        {
          messageId: "preferShadcn",
          data: {
            tag: "input",
            component: "RadioGroup",
            from: "@/components/ui/radio-group",
          },
        },
      ],
    },
    // ── <input type="file"> falls through to generic Input ──
    {
      code: `const X = () => <input type="file" />;`,
      filename: "/src/components/features/foo.tsx",
      errors: [
        {
          messageId: "preferShadcn",
          data: {
            tag: "input",
            component: "Input",
            from: "@/components/ui/input",
          },
        },
      ],
    },
    // ── Native <textarea> ──
    {
      code: `const X = () => <textarea />;`,
      filename: "/src/components/features/foo.tsx",
      errors: [
        {
          messageId: "preferShadcn",
          data: {
            tag: "textarea",
            component: "Textarea",
            from: "@/components/ui/textarea",
          },
        },
      ],
    },
    // ── Native <button> ──
    {
      code: `const X = () => <button>click</button>;`,
      filename: "/src/routes/_auth/foo.tsx",
      errors: [
        {
          messageId: "preferShadcn",
          data: {
            tag: "button",
            component: "Button",
            from: "@/components/ui/button",
          },
        },
      ],
    },
    // ── Native <label> ──
    {
      code: `const X = () => <label htmlFor="x">x</label>;`,
      filename: "/src/components/features/foo.tsx",
      errors: [
        {
          messageId: "preferShadcn",
          data: {
            tag: "label",
            component: "Label",
            from: "@/components/ui/label",
          },
        },
      ],
    },
    // ── Native <select> ──
    {
      code: `const X = () => <select><option>a</option></select>;`,
      filename: "/src/components/features/foo.tsx",
      errors: [
        {
          messageId: "preferShadcn",
          data: {
            tag: "select",
            component: "Select",
            from: "@/components/ui/select",
          },
        },
      ],
    },
    // ── Table parts each report individually ──
    {
      code: `const X = () => <table><tbody><tr><td>x</td></tr></tbody></table>;`,
      filename: "/src/components/features/foo.tsx",
      errors: [
        {
          messageId: "preferShadcn",
          data: {
            tag: "table",
            component: "Table",
            from: "@/components/ui/table",
          },
        },
        {
          messageId: "preferShadcn",
          data: {
            tag: "tbody",
            component: "TableBody",
            from: "@/components/ui/table",
          },
        },
        {
          messageId: "preferShadcn",
          data: {
            tag: "tr",
            component: "TableRow",
            from: "@/components/ui/table",
          },
        },
        {
          messageId: "preferShadcn",
          data: {
            tag: "td",
            component: "TableCell",
            from: "@/components/ui/table",
          },
        },
      ],
    },
  ],
})

console.log("All tests passed!")
