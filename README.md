# glazecraft 🍯

**A React-style frontend framework for Corros** — components, props, hooks
(`use_state`), nested stateful components, event handling, diffing, and
**server-side rendering with hydration and live updates**, written entirely in
[Corros](https://github.com/CocoCopi/corros). Components are plain Corros
crafts; the browser runtime (`web/glaze.js`) is a single dependency-free
JavaScript file.

| React | glazecraft |
|---|---|
| `React.createElement("div", props, ...children)` | `el("div", props, children)` |
| `function Greet({name}) { return <p>Hi {name}</p> }` | `component(craft(props) { return el("p", {}, ["Hi " + props["name"]]) })` |
| `useState(0)` | `use_state(0)` → `[value, setter]` |
| `<button onClick={fn}>` | `el("button", { "on_click": fn }, ["go"])` |
| `renderToString(<App/>)` | `glaze_render(App, props)` |
| `ReactDOM.hydrate` | `glaze_hydrate(app)` + `glazecraft.mountAll()` |
| `key` prop / reconciliation | `key` prop; nested state persists; `glaze_diff(old, new)` |
| live re-renders in the browser | `/_glaze/event` round-trip (server re-renders, client patches) |

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
    el("button", { "on_click": set, "data-glaze-value": "1" }, ["+1"])
  ])
})

forge app = glaze_mount(Counter, {})
speak(app["html"])              // <div class="counter"><p>0</p>...
app["set_state"](0, 5)          // update state slot 0 -> re-render
speak(app["html"])              // <div class="counter"><p>5</p>...
```

## The frontend story (SSR → hydration → live updates)

1. **Server-side render** — `glaze_mount(comp, props)` renders the component;
   every element with an `on_*` prop is marked `data-glaze-h`/`data-glaze-evt`.
2. **Hydrate** — `glaze_hydrate(app)` registers the app and returns `{id, html}`
   to embed in the page; `web/glaze.js` (`glazecraft.mountAll()`) attaches the
   events.
3. **Live updates** — an event posts `{id, h, value}` to `/_glaze/event`; the
   server runs the handler, re-renders, diffs, and replies `ok\n<new html>`;
   the client replaces the root and re-wires. `examples/serve.cro` and
   `glazecraft serve` are complete working examples (served by
   [kilncraft](https://github.com/CocoCopi/kilncraft), the sibling backend
   framework).

## Features

- `el(tag, props, children)` — virtual nodes; sorted attributes, HTML
  escaping, void elements
- `component(craft)` — any render function becomes a component
- `use_state(init)` — per-instance hooks; setters re-render
- Nested components with their own state (persisted via `key`/position)
- Conditional rendering (`when`), lists (`each`), fragments (return a list)
- `glaze_handlers(vnode, [])` — collect `on_*` handlers
- `glaze_diff(old, new)` — token-level diff (common prefix/suffix + changed middle)
- `glaze_page(title, vnode)` — full HTML document
- `glaze_hydrate(app)` + `glaze_handle_event(app, h, value)` — the live-update API

## Tests

```bash
bash tests/run.sh
```

1. **Corros suite** (`tests/t_glaze.cro`) — elements, attributes, escaping,
   components, hooks, nested state, events, diff, hydration, live events.
2. **Browser runtime** (`tests/glaze_dom_test.js`, Node) — loads `web/glaze.js`
   in a sandboxed fake DOM, simulates a click, and asserts the XHR round-trip.
3. **Live round-trip** — boots `glazecraft serve` and POSTs a real event.

## Pairing

- **Backend**: [kilncraft](https://github.com/CocoCopi/kilncraft) — the
  Express-style server framework this demo's `serve` mode routes through.
- **Math**: [oremath](https://github.com/CocoCopi/oremath) /
  [cryotorch](https://github.com/CocoCopi/cryotorch) for any server-side
  computation the components need.

## Honest scope

The component/state/composition model is React's; the **re-render happens on
the server** (a LiveView-style architecture) because Corros runs server-side —
the browser gets the diffed HTML via `/_glaze/event`, and `glaze.js` patches
the DOM. That's a real frontend framework in the React mold, minus a
client-side VDOM: there's no way to run Corros render functions in the browser
(yet — a Corros→JS compiler is the natural next step).

## License

MIT — see [LICENSE](LICENSE). Built with Corros; see the
[Corros repo](https://github.com/CocoCopi/corros) for the language.
