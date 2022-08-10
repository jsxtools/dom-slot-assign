# DOM Slot Assign <img src="https://jonneal.dev/js-logo.svg" alt="" width="90" height="90" align="right">

[![npm version][npm-img]][npm-url]
[![bundle size][bundlejs-img]][bundlejs-url]
[![npm usage][usage-img]][npm-url]

**DOM Slot Assign** is a polyfill that allows you to use [imperative slot assignment](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assign), following the [HTML specification](https://html.spec.whatwg.org/multipage/scripting.html#dom-slot-assign).

<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLSlotElement/assign#browser_compatibility"><img src="./.vscode/browser-compatibility.webp" alt="table of browser compatibility" /></a>

### Usage

Include **DOM Slot Assign** in your project.

```js
import "https://unpkg.com/dom-slot-assign@0.1"
```

```html
<script src="https://unpkg.com/dom-slot-assign@0.1"></script>
```

If you're ok with [slightly reduced browser support](https://caniuse.com/mdn-javascript_operators_await_top_level),
you can include it conditionally, only when needed:

```js
if (!globalThis?.HTMLSlotElement?.prototype.assign) {
  await import("https://unpkg.com/dom-slot-assign@0.1");
}
```

You can also use npm:

```js
// npm install dom-slot-assign
import "dom-slot-assign"
```

That’s it. Now use imperative slotting in your project.

### Example

This example creates a `<content-tabs>` element. From its children, any `<h1>` - `<h6>` element generates a new `<details>` / `<summary>` in its shadow dom, with the heading slotted into the summary. Any content after that heading and before the next heading is added as content to the current details.

```js
customElements.define('content-tabs', class extends HTMLElement {
  constructor() {
    let host = super()
    let root = host.attachShadow({ mode: 'open', slotAssignment: 'manual' })

    root.innerHTML += '<style>::slotted(:is(h1, h2, h3, h4, h5, h6)) { display: contents; pointer-events: none; }</style>'

    if (host.childNodes.length) host.contentChangedCallback()

    new MutationObserver(() => host.contentChangedCallback()).observe(host, { childList: true })
  }

  contentChangedCallback() {
    let root = this.shadowRoot
    let [ style ] = root.childNodes
    let details, summary, content

    // clear the shadow root
    root.replaceChildren(style)

    // for each slottable child
    for (let node of this.childNodes) {
      // ignore leading text nodes
      if (!details && node.nodeType !== 1) continue

      // create new summary details with headings
      if (node instanceof HTMLHeadingElement) {
        details = root.appendChild(document.createElement('details'))
        summary = details.appendChild(document.createElement('summary'))
        summary.appendChild(document.createElement('slot')).assign(node)
        content = undefined
      } else {
        // put adjacent comments in summary details below headings
        content = content || details.appendChild(document.createElement('slot'))
        content.assign(...content.assignedNodes(), node)
      }
    }
  }
})
```

[**Open this example on CodePen**](https://codepen.io/jonneal/pen/xxWgyXX?editors=1010)

### How the polyfill works

When the `<slot>` element lacks an `assign()` method, the polyfill is activated.

#### The polyfilled `assign()` method

An `assign()` method works by detecting whether the given slot belongs to a shadow root with manual slot assignment
If it does, it assigns a unique name to the given slot, which is never actually used.
Then, each assigned `Element` node has its `slot` set a separate, private `slot`, which is then appended to the given `slot`.

```jsx
<#shadow-root>
  <!-- public slot created by the user -->
  <slot name="">
    <slot style="display:contents!important" name="">
      <!-- private slot for the first element -->
    </slot>
    <slot style="display:contents!important" name="">
      <!-- private slot for the second element -->
    </slot>
    <slot style="display:contents!important" name="">
      <!-- private slot for the N element -->
    </slot>
  </slot>
</#shadow-root>
```

Assigned `Text` nodes are cloned and each clone is placed inside a private `slot`, which is also appended to the given slot.
The original text nodes are observed for `DOMCharacterDataModified` and `DOMNodeRemoved` to update or remove the clone.

```jsx
<#shadow-root>
  <!-- public slot created by the user -->
  <slot name="">
    <slot style="display:contents!important" name="">
      <!-- private slot for the first element -->
    </slot>
    <slot style="display:contents!important" name="">
      <!-- private slot for the second element -->
    </slot>
    <slot style="display:contents!important" name="">
      A cloned text node.
    </slot>
    <slot style="display:contents!important" name="">
      <!-- private slot for the N element -->
    </slot>
  </slot>
</#shadow-root>
```

#### The polyfilled `assignedNodes()` method

A new `assignedNodes()` method returns an array of all nodes privately assigned to the slot that are still connected.

#### The polyfilled `assignedElements()` method

A new `assignedElements()` method returns an array of all elements privately assigned to the slot that are still connected.

#### The polyfilled `slotAssignment` property

An overriding `attachShadow()` method detects the `slotAssignment: "manual"` option and enables slot elements within the given shadow root to support the `assign` method.
To prevent any accidental ‘named’ slot assignments, the shadow root is observed for `slotchange` to enforce the manual assignment.

[npm-url]: https://www.npmjs.com/package/dom-slot-assign
[bundlejs-url]: https://bundlejs.com/?bundle&q=dom-slot-assign

[npm-img]: https://img.shields.io/npm/v/dom-slot-assign?color=%23444&label=&labelColor=%23CB0000&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjE1MCAxNTAgNDAwIDQwMCIgZmlsbD0iI0ZGRiI+PHBhdGggZD0iTTE1MCA1NTBoMjAwVjI1MGgxMDB2MzAwaDEwMFYxNTBIMTUweiIvPjwvc3ZnPg==&style=for-the-badge
[bundlejs-img]: https://img.shields.io/badge/dynamic/json?url=https://bundlejs.com/api?q=dom-slot-assign&query=size.totalCompressedSize&color=%23444&labelColor=%233B82F6&label=&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3MDAgNzAwIiBmaWxsPSIjRkZGIj4KCTxwYXRoIGQ9Ik0xNDYgMkExNzEgMTcxIDAgMCAwIDMgMTM5bC0yIDExdjQwMmwyIDExYzE1IDcyIDcxIDEyNSAxNDMgMTM2bDIwOSAxIDE5OS0xIDktMmM3MC0xNiAxMTktNjYgMTM0LTEzNWwyLTEwVjE1MGwtMi0xMkExNzEgMTcxIDAgMCAwIDU2MiAzbC0xMC0yLTE5OS0xQzE4NyAwIDE1MyAwIDE0NiAyem0xODEgMjUxdjM2bDctM2MxMy02IDMzLTkgNTAtNyA0MSA1IDcwIDM0IDgwIDc4IDIgMTIgMiA0MSAwIDUzLTUgMjItMTMgMzgtMjcgNTJhODIgODIgMCAwIDEtNjMgMjZjLTE1IDAtMTkgMC0yNS0yLTEwLTItMTctNi0yNC0xMGwtNS0zdjExaC00NVYyMTdoNTJ2MzZ6bTI5IDcxYy0yMCAzLTMyIDE5LTM1IDQ4LTMgMjUgMyA0OCAxNCA2MCA1IDYgMTMgMTAgMjMgMTEgMjUgNCA0NC05IDUxLTM2bDMtMTljMC0xNy0xLTI3LTctMzktOS0xOS0yNi0yOC00OS0yNXoiLz4KPC9zdmc+&style=for-the-badge
[usage-img]: https://img.shields.io/badge/dynamic/json?url=https://api.npmjs.org/downloads/point/last-week/dom-slot-assign&query=downloads&label=⇓+week&color=%23444&labelColor=%23EEd100&style=for-the-badge
