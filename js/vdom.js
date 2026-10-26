// Kleiner DOM-Abgleich: Ansichten werden als h('div', props, ...kinder) beschrieben,
// render() ändert im echten DOM nur, was sich unterscheidet.
//
// Props: `key` (Abgleich in Listen), `on*` (Ereignisse), `style` (Text oder Objekt),
// `class`, Eigenschaften wie `value`/`disabled`, alles andere als Attribut.
// `oncreate(el)` läuft einmal, nachdem das Element im DOM steht.

const SVG_NS = 'http://www.w3.org/2000/svg';
const PROPS = new Set(['value', 'checked', 'disabled', 'selected', 'indeterminate']);

export function h(tag, props, ...children) {
  const p = props || {};
  return { tag, props: p, key: p.key, children: flatten(children, []) };
}

function flatten(list, out) {
  for (const c of list) {
    if (c == null || c === false || c === true) continue;
    if (Array.isArray(c)) flatten(c, out);
    else out.push(typeof c === 'object' ? c : { text: String(c) });
  }
  return out;
}

let created = [];

export function render(container, vnode) {
  const next = flatten([vnode], []);
  created = [];
  patchChildren(container, container._vnodes || [], next, false);
  container._vnodes = next;
  const hooks = created;
  created = [];
  for (const [fn, el] of hooks) fn(el);
}

function create(v, svg) {
  if (v.text !== undefined) { v.el = document.createTextNode(v.text); return v.el; }
  const isSvg = svg || v.tag === 'svg';
  const el = isSvg ? document.createElementNS(SVG_NS, v.tag) : document.createElement(v.tag);
  v.el = el;
  setProps(el, {}, v.props, isSvg);
  for (const c of v.children) el.appendChild(create(c, isSvg && v.tag !== 'foreignObject'));
  if (typeof v.props.oncreate === 'function') created.push([v.props.oncreate, el]);
  return el;
}

const same = (a, b) => (a.text !== undefined) === (b.text !== undefined) && a.tag === b.tag;

function patch(o, n, svg) {
  n.el = o.el;
  if (n.text !== undefined) {
    if (o.text !== n.text) n.el.nodeValue = n.text;
    return;
  }
  const isSvg = svg || n.tag === 'svg';
  setProps(n.el, o.props, n.props, isSvg);
  patchChildren(n.el, o.children, n.children, isSvg && n.tag !== 'foreignObject');
}

function patchChildren(parent, oldCh, newCh, svg) {
  const byKey = new Map();
  for (const o of oldCh) if (o.key != null) byKey.set(o.key, o);
  const used = new Set();
  newCh.forEach((n, i) => {
    let o = null;
    if (n.key != null) o = byKey.get(n.key) || null;
    else if (oldCh[i] && oldCh[i].key == null) o = oldCh[i];
    if (o && !used.has(o) && same(o, n)) { patch(o, n, svg); used.add(o); }
    else create(n, svg);
    const at = parent.childNodes[i];
    if (at !== n.el) parent.insertBefore(n.el, at || null);
  });
  for (const o of oldCh) if (!used.has(o) && o.el && o.el.parentNode === parent) parent.removeChild(o.el);
}

function setProps(el, oldP, newP, svg) {
  for (const k in oldP) if (!(k in newP)) setProp(el, k, oldP[k], undefined, svg);
  for (const k in newP) if (oldP[k] !== newP[k] || PROPS.has(k)) setProp(el, k, oldP[k], newP[k], svg);
}

function setProp(el, k, oldV, v, svg) {
  if (k === 'key' || k === 'oncreate') return;
  if (k[0] === 'o' && k[1] === 'n') {
    const type = k.slice(2).toLowerCase();
    const store = el._on || (el._on = {});
    if (!store[type] && v) el.addEventListener(type, e => store[type] && store[type](e));
    store[type] = v || null;
    return;
  }
  if (k === 'style') {
    if (typeof v === 'object' && v) {
      el.style.cssText = '';
      for (const s in v) el.style.setProperty(s, v[s]);
    } else el.style.cssText = v || '';
    return;
  }
  if (k === 'class' || k === 'className') {
    if (svg) el.setAttribute('class', v || ''); else el.className = v || '';
    return;
  }
  if (PROPS.has(k) && !svg) {
    const val = k === 'value' ? (v ?? '') : !!v;
    if (el[k] !== val) el[k] = val;
    return;
  }
  if (v == null || v === false) el.removeAttribute(k);
  else el.setAttribute(k, v === true ? '' : String(v));
}

// Merkt sich das letzte Ergebnis für dieselben Argumente
export function memo(fn) {
  let lastArgs = null, last;
  return (...args) => {
    if (lastArgs && args.length === lastArgs.length && args.every((a, i) => a === lastArgs[i])) return last;
    lastArgs = args;
    last = fn(...args);
    return last;
  };
}
