/**
 * @fileoverview Tests for max-component-declarations rule.
 */

"use strict"

const { RuleTester } = require("eslint")
const rule = require("./max-component-declarations")

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
})

ruleTester.run("max-component-declarations", rule, {
  valid: [
    // ── Single component — always fine ──
    {
      code: `function App() { return <div />; }`,
      options: [{ max: 3 }],
    },
    // ── Arrow function component ──
    {
      code: `const App = () => <div />;`,
      options: [{ max: 3 }],
    },
    // ── Multiple components under max ──
    {
      code: [
        `function Header() { return <header />; }`,
        `function Footer() { return <footer />; }`,
        `function Main() { return <main />; }`,
      ].join("\n"),
      options: [{ max: 3 }],
    },
    // ── Non-component uppercase functions (no JSX) are not counted ──
    {
      code: [
        `function ParseJSON(str) { return JSON.parse(str); }`,
        `function FormatDate(d) { return d.toISOString(); }`,
        `function App() { return <div />; }`,
      ].join("\n"),
      options: [{ max: 1 }],
    },
    // ── Lowercase functions with JSX are not counted ──
    {
      code: [
        `function renderItem() { return <li />; }`,
        `function renderHeader() { return <header />; }`,
        `function App() { return <div />; }`,
      ].join("\n"),
      options: [{ max: 1 }],
    },
    // ── Default max (3) — exactly 3 components ──
    {
      code: [
        `function A() { return <div />; }`,
        `function B() { return <span />; }`,
        `const C = () => <p />;`,
      ].join("\n"),
    },
    // ── Function expressions ──
    {
      code: `const App = function() { return <div />; };`,
      options: [{ max: 1 }],
    },
  ],

  invalid: [
    // ── Exceeds max with function declarations ──
    {
      code: [
        `function A() { return <div />; }`,
        `function B() { return <span />; }`,
        `function C() { return <p />; }`,
        `function D() { return <h1 />; }`,
      ].join("\n"),
      options: [{ max: 3 }],
      errors: [{ messageId: "tooMany", data: { count: "4", max: "3" } }],
    },
    // ── Exceeds max with arrow functions ──
    {
      code: [`const A = () => <div />;`, `const B = () => <span />;`].join(
        "\n",
      ),
      options: [{ max: 1 }],
      errors: [{ messageId: "tooMany", data: { count: "2", max: "1" } }],
    },
    // ── Mixed function declarations and arrow functions ──
    {
      code: [
        `function Header() { return <header />; }`,
        `const Footer = () => <footer />;`,
        `function Sidebar() { return <aside />; }`,
        `const Main = () => <main />;`,
      ].join("\n"),
      options: [{ max: 3 }],
      errors: [{ messageId: "tooMany", data: { count: "4", max: "3" } }],
    },
    // ── Default max (3) exceeded ──
    {
      code: [
        `function A() { return <div />; }`,
        `function B() { return <span />; }`,
        `function C() { return <p />; }`,
        `function D() { return <h1 />; }`,
      ].join("\n"),
      errors: [{ messageId: "tooMany", data: { count: "4", max: "3" } }],
    },
    // ── Function expressions count too ──
    {
      code: [
        `const A = function() { return <div />; };`,
        `const B = function() { return <span />; };`,
      ].join("\n"),
      options: [{ max: 1 }],
      errors: [{ messageId: "tooMany", data: { count: "2", max: "1" } }],
    },
    // ── JSX fragments count ──
    {
      code: [
        `function A() { return <><div /></>; }`,
        `function B() { return <><span /></>; }`,
      ].join("\n"),
      options: [{ max: 1 }],
      errors: [{ messageId: "tooMany", data: { count: "2", max: "1" } }],
    },
  ],
})

console.log("All tests passed!")
