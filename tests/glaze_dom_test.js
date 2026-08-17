// glaze_dom_test.js — smoke-test the browser runtime in Node with a fake DOM:
// loads web/glaze.js in a vm sandbox, mounts a root, simulates a click on a
// marked button, and asserts the XHR round-trip.
var fs = require("fs");
var vm = require("vm");
var path = require("path");

var code = fs.readFileSync(path.join(__dirname, "..", "web", "glaze.js"), "utf8");

function FakeEl() {
  this.attrs = {};
  this.listeners = {};
  this._inner = "";
  this._children = [];
}
FakeEl.prototype.setAttribute = function (k, v) { this.attrs[k] = String(v); };
FakeEl.prototype.getAttribute = function (k) {
  return this.attrs[k] == null ? null : this.attrs[k];
};
FakeEl.prototype.addEventListener = function (evt, fn) {
  (this.listeners[evt] = this.listeners[evt] || []).push(fn);
};
Object.defineProperty(FakeEl.prototype, "innerHTML", {
  get: function () { return this._inner; },
  set: function (v) {
    // real browsers rebuild the subtree on innerHTML replace: simulate that
    this._inner = v;
    this._children = [];
  }
});
FakeEl.prototype.querySelectorAll = function (sel) {
  if (sel === "[data-glaze-h]") return this._children;
  return [];
};
FakeEl.prototype.querySelector = function () { return null; };

var root = new FakeEl();
root.setAttribute("data-glaze-id", "g1");
var btn = new FakeEl();
btn.setAttribute("data-glaze-h", "0");
btn.setAttribute("data-glaze-evt", "click");
btn.setAttribute("data-glaze-value", "5");
root._children.push(btn);

var doc = {
  readyState: "complete",
  querySelectorAll: function (sel) {
    if (sel === "[data-glaze-id]") return [root];
    return [];
  },
  querySelector: function () { return null; },
  addEventListener: function () {}
};

var calls = [];
function FakeXHR() { this._status = 0; this._text = ""; this.readyState = 0; }
FakeXHR.prototype.open = function (m, u) { this.method = m; this.url = u; };
FakeXHR.prototype.setRequestHeader = function () {};
FakeXHR.prototype.send = function (body) {
  calls.push({ url: this.url, body: body });
  this._status = 200;
  this._text = "ok\n<p>5</p>";
  this.readyState = 4;
  this.onreadystatechange();
};
Object.defineProperty(FakeXHR.prototype, "status", { get: function () { return this._status; } });
Object.defineProperty(FakeXHR.prototype, "responseText", { get: function () { return this._text; } });

var sandbox = {
  window: undefined,
  document: doc,
  XMLHttpRequest: FakeXHR,
  console: console,
  encodeURIComponent: encodeURIComponent,
  Object: Object,
  Array: Array,
  String: String,
  Number: Number
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox);

sandbox.glazecraft.mountAll();

if (btn.listeners.click.length !== 1) {
  throw new Error("expected 1 click listener, got " + btn.listeners.click.length);
}
btn.listeners.click[0]({ preventDefault: function () {} });

if (calls.length !== 1) throw new Error("expected 1 XHR call, got " + calls.length);
if (calls[0].url !== "/_glaze/event") throw new Error("bad url: " + calls[0].url);
if (calls[0].body.indexOf("id=g1") < 0) throw new Error("bad body (id): " + calls[0].body);
if (calls[0].body.indexOf("h=0") < 0) throw new Error("bad body (h): " + calls[0].body);
if (calls[0].body.indexOf("value=5") < 0) throw new Error("bad body (value): " + calls[0].body);
if (root._inner !== "<p>5</p>") throw new Error("html not applied: " + root._inner);

console.log("glaze.js DOM smoke test OK — XHR: " + calls[0].body);
