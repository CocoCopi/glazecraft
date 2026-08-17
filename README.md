# glazecraft 🍯

**A React-style component framework for Corros** — components, props, hooks
(`use_state`), nested stateful components, event handling, diffing, and
server-side rendering, written entirely in [Corros](https://github.com/CocoCopi/corros).
No JavaScript, no Node, no dependencies — components are plain Corros crafts,
and the output is HTML.

| React | glazecraft |
|---|---|
| `React.createElement("div", props, ...children)` | `el("div", props, children)` |
| `function Greet({name}) { return <p>Hi {name}</p> }` | `component(craft(props) { return el("p", {}, ["Hi " + props["name"]]) })` |
| `useState(0)` | `use_state(0)` → `[value, setter]` |
| `<button onClick={fn}>` | `el("button", { "on_click": fn }, ["go"])` |
| `renderToString(<App/>)` | `glaze_render(App, props)` |
| `ReactDOM.render` | `glaze_mount(App, props)` → `app["html"]` |
| `key` prop / reconciliation | `key` prop; nested component state persists; `glaze_diff(old, new)` |
| `dangerouslySetInnerHTML` | (not needed — `el` accepts raw text, escaped by default) |

## Install (one line)

```bash
curl -fsSL https://raw.githubusercontent.com/CocoCopi/glazecraft/main/install.sh | sh
glazecraft render
```

## Use it in your own Corros programs

```corros
adopt "/path/to/glazecraft/src/glaze.cro"

forge Counter = component(craft(props) {
  forge pair = use_state(0)
  forge count = pair[0]
  forge set = pair[1]
  return el("div", { "class": "counter" }, [
    el("p", {}, [str(count)]),
    el("button", { "on_click": set }, ["+1"])
  ])
})

forge app = glaze_mount(Counter, {})
speak(app["html"])              // <div class="counter"><p>0</p><button>+1</button></div>
app["set_state"](0, 5)          // update state slot 0 -> re-render
speak(app["html"])              // <div class="counter"><p>5</p>...
```

## Features

- **`el(tag, props, children)`** — virtual nodes; props become attributes
  (sorted for deterministic output), text is HTML-escaped, void elements
  (img, br, input, …) are handled
- **`component(craft)`** — any render function becomes a component
- **`use_state(init)`** — hooks with persistent per-instance state; setters
  re-render just that component
- **Nested components** — each has its own state, persisted across parent
  re-renders (keyed by `key` prop or position)
- **Conditional rendering** (`when`), **lists** (`each`), fragments (return a list)
- **`glaze_handlers(vnode, [])`** — collect every `on_*` handler for a browser bridge
- **`glaze_diff(old, new)`** — token-level diff (common prefix/suffix + changed middle)
- **`glaze_page(title, vnode)`** — full HTML document
- **`glazecraft serve`** — serves a rendered page over HTTP (pure Corros sockets)

## Tests

```bash
corros tests/t_glaze.cro
```

Covers elements, attributes, escaping, components, props, conditional and
list rendering, `use_state` + setters (driven through handlers), nested
component state persistence, events, diffing, and full pages.

## Honest scope

glazecraft is a **server-side rendering framework**: components render to
HTML strings (React's `renderToString` model). There's no browser DOM — the
event handlers are collected for you to wire up (`glaze_handlers`), and
`glaze_diff` reports what changed between renders. That covers the
component/state/composition model that makes React what it is, in pure Corros.

## License

MIT — see [LICENSE](LICENSE). Built with Corros; see the
[Corros repo](https://github.com/CocoCopi/corros) for the language.
