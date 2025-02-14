import { isArray, isFunction, isObject, isString, isUndefined } from './utils.js';
import { createContext } from './context.js';
import { effect } from './signal.js';

/**
 * Create an element from a tag string, HTML markup or an Element.
 *
 * @param {string|Element} tag Tag string, HTML markup or Element.
 * @param {string} [ns] Namespace URI.
 * @returns {Element}
 */
function createElement(tag, ns) {
  const { Element } = window;
  const classList = [];
  let el, tagName, id;

  if (isString(tag)) {
    if (/[^a-zA-Z0-9-_.#]/u.test(tag)) {
      // if tag is HTML markup
      const div = document.createElement('div');
      div.innerHTML = tag;
      if (div.firstChild instanceof Element) {
        el = div.firstChild;
        tagName = el.tagName;
      }
    }
    else {
      // if tag is a tag string with optional id and class names
      const match = tag.match(/([.#]?[^\s#.]+)/ug) || [];
      for (const item of match) {
        const firstChar = item[0];
        if (firstChar === '.') classList.push(item.slice(1));
        else if (firstChar === '#') id = item.slice(1);
        else tagName = item;
      }
    }
  }
  else if (tag instanceof Element) {
    // if tag is an Element
    el = tag;
    tagName = el.tagName;
  }
  // create element if not exists
  if (!el) {
    if (ns === 'http://www.w3.org/1999/xhtml') {
      ns = null;
    }
    if (!ns) {
      switch (`${tagName}`.toLowerCase()) {
        case 'svg':
          ns = 'http://www.w3.org/2000/svg';
          break;
        case 'math':
          ns = 'http://www.w3.org/1998/Math/MathML';
          break;
      }
    }
    el = ns
      ? document.createElementNS(ns, tagName)
      : document.createElement(tagName);
  }
  // set id and classList if defined
  if (id) el.id = id;
  if (classList.length) el.className = classList.join(' ');

  return el;
}

/**
 * Create an element with HyperScript-like syntax.
 *
 * Usage examples:
 *   h('div', { id: 'my-id', classList: ['my-class'] }, 'Hello');
 *   h('div#my-id.my-class', 'Hello');
 *   h('div', [h('span', 'Hello'), h('span', 'World')]);
 *
 * @param {string|Element} tag Tag name or Element.
 * @param {object|*} [config] Element configuration or children if omitted.
 * @param {*} [children] Element content or children elements.
 * @returns {Element}
 */
export function h(tag, config, children) {
  if (!isObject(config) || isArray(config)) {
    children = config;
    config = {};
  }
  return render.call(this, { tag, children, ...config });
}

/**
 * Create an element with specified configuration.
 *
 * @param {object} [config] Element configuration.
 * @returns {Element}
 */
export function render(config) {
  if (!isObject(config)) return config;
  const { Element } = window;
  const context = createContext(this);
  const {
    tagName = 'div',
    tag,
    namespaceURI,
    classList,
    attributes,
    style,
    dataset,
    on,
    children,
    ref,
    ...rest
  } = config;
  const cleanups = [];
  // watch for reactive properties
  const resolve = (getter, setter) => {
    if (isFunction(getter)) {
      const dispose = effect.call(context, getter, setter);
      cleanups.push(dispose);
    }
    else {
      setter(getter);
    }
  };
  // create element
  const el = createElement(tag ?? tagName, namespaceURI);
  // parse event handlers
  if (!isUndefined(on)) {
    for (const ev in on) {
      const handler = on[ev];
      if (isFunction(handler)) {
        el.addEventListener(ev, e => handler.call(context, e));
      }
    }
  }
  // add custom event listeners
  const dispatchEvent = ({ children }, event) => {
    for (const child of children) {
      const ev = new CustomEvent(event, { cancelable: true });
      child.dispatchEvent(ev);
    }
  };
  el.addEventListener('mounted', (e) => {
    if (!e.defaultPrevented) {
      dispatchEvent(el, 'mounted');
    }
  });
  el.addEventListener('removed', (e) => {
    if (!e.defaultPrevented) {
      dispatchEvent(el, 'removed');
      for (const cleanup of cleanups) cleanup();
    }
  });
  // parse classList
  if (!isUndefined(classList)) {
    resolve(classList, (value) => {
      if (Array.isArray(value)) {
        el.classList = value.join(' ');
      }
      else if (isString(value)) {
        el.classList = value;
      }
    });
  }
  // parse attributes
  if (!isUndefined(attributes)) {
    resolve(attributes, (attributes) => {
      for (const attr in attributes) {
        resolve(attributes[attr], (value) => {
          if (isUndefined(value)) el.removeAttribute(attr);
          else el.setAttribute(attr, value);
        });
      }
    });
  }
  // parse styles
  if (!isUndefined(style)) {
    resolve(style, (style) => {
      for (const prop in style) {
        resolve(style[prop], (value) => {
          if (/[A-Z]/u.test(prop)) {
            // camelCase
            if (isUndefined(value)) delete el.style[prop];
            else el.style[prop] = value;
          }
          else {
            // kebab-case
            if (isUndefined(value)) el.style.removeProperty(prop);
            else el.style.setProperty(prop, value);
          }
        });
      }
    });
  }
  // parse dataset
  if (!isUndefined(dataset)) {
    resolve(dataset, (dataset) => {
      for (const prop in dataset) {
        resolve(dataset[prop], (value) => {
          if (isUndefined(value)) delete el.dataset[prop];
          else el.dataset[prop] = value;
        });
      }
    });
  }
  // set rest element parameters
  for (const prop in rest) {
    resolve(rest[prop], (value) => {
      if (isUndefined(value)) delete el[prop];
      else el[prop] = value;
    });
  }
  // parse children
  if (!isUndefined(children)) {
    resolve(children, (value, index, op) => {
      if (op === 'del') {
        const oldChild = el.children[index];
        if (oldChild) {
          el.removeChild(oldChild);
        }
      }
      else if (op === 'add') {
        const opts = isObject(value)
          ? { namespaceURI: el.namespaceURI, ...value }
          : value;
        const newChild = render.call(context, opts);
        if (newChild) {
          el.appendChild(newChild);
        }
      }
      else if (op === 'upd') {
        const oldChild = el.children[index];
        if (oldChild) {
          const opts = isObject(value)
            ? { namespaceURI: el.namespaceURI, ...value }
            : value;
          const newChild = render.call(context, opts);
          if (newChild) {
            el.replaceChild(newChild, oldChild);
          }
        }
      }
      else {
        el.innerHTML = '';
        if (isObject(value)) {
          const nodes = [].concat(value);
          for (const node of nodes) {
            const opts = isObject(node)
              ? { namespaceURI: el.namespaceURI, ...node }
              : node;
            const child = render.call(context, opts);
            if (child instanceof Element) {
              el.appendChild(child);
            }
          }
        }
        else {
          const child = document.createTextNode(value);
          el.appendChild(child);
        }
      }
    });
  }
  // set reference
  if (isFunction(ref)) {
    ref.call(context, el);
  }
  return el;
}
