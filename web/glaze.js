/* glaze.js — glazecraft browser runtime.
 *
 * The server renders a component to HTML and marks every element with an
 * on_* handler using data-glaze-h / data-glaze-evt (see glaze.cro). This
 * script hydrates those roots and wires the events: on click (or any marked
 * event) it POSTs {id, h, value} to /_glaze/event; the server runs the
 * handler, re-renders, and replies "ok\n<new html>", which replaces the root.
 *
 * No build step, no dependencies — one file, plain ES5.
 */
(function (global) {
  "use strict";

  function qsa(root, sel) {
    return root.querySelectorAll ? root.querySelectorAll(sel) : [];
  }

  function postForm(url, data, cb) {
    var body = Object.keys(data).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(data[k] == null ? "" : data[k]);
    }).join("&");
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) cb(xhr.status, xhr.responseText);
    };
    xhr.send(body);
  }

  function apply(root, html) {
    root.innerHTML = html;
    wire(root, root.getAttribute("data-glaze-id"));
  }

  function wire(root, id) {
    var els = qsa(root, "[data-glaze-h]");
    for (var i = 0; i < els.length; i++) {
      (function (el) {
        if (el.__glaze_wired) return;   // idempotent: mountAll is safe to repeat
        el.__glaze_wired = true;
        var h = el.getAttribute("data-glaze-h");
        var evt = el.getAttribute("data-glaze-evt") || "click";
        el.addEventListener(evt, function (e) {
          if (e && e.preventDefault) e.preventDefault();
          var val = el.getAttribute("data-glaze-value");
          postForm("/_glaze/event", { id: id, h: h, value: val }, function (status, text) {
            if (status !== 200) { console.error("glazecraft: HTTP", status, text); return; }
            var nl = text.indexOf("\n");
            var head = text.slice(0, nl);
            var html = text.slice(nl + 1);
            if (head === "ok") { apply(root, html); }
            else { console.error("glazecraft: server error:", html); }
          });
        });
      })(els[i]);
    }
  }

  var glazecraft = {
    mount: function (id) {
      var root = global.document && global.document.querySelector('[data-glaze-id="' + id + '"]');
      if (root) wire(root, id);
    },
    mountAll: function () {
      if (!global.document) return;
      var roots = global.document.querySelectorAll("[data-glaze-id]");
      for (var i = 0; i < roots.length; i++) {
        wire(roots[i], roots[i].getAttribute("data-glaze-id"));
      }
    }
  };

  global.glazecraft = glazecraft;

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", function () { glazecraft.mountAll(); });
    } else {
      glazecraft.mountAll();
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
