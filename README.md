# `{\}` NEUX

[NEUX](https://github.com/meefik/neux) is Non-imperative Expressions of the User eXperience. It is a framework agnostic micro-library with rendering DOM from declarative definitions and reactive signals, localization and remote procedure calls. The library provides features and tools for building single page applications (SPA) and web components.

Here are the main concepts behind NEUX:

- Minimal interaction with the library during development, more native JS code and browser API.
- Declarative definitions for describing DOM elements with reactive states using plain JS objects and functions.
- Support for modern two-way reactivity.
- Built-in localization module and RPC calls to backend functions.
- Out-of-the-box integration with CSS modules or Tailwind CSS.
- Can be used with Web Components.
- Small library size ~ 8kb (4kb gzipped).
- It is open source software under MIT license.

## Content

1. [Getting started](#getting-started)
2. [Reactive states](#reactive-states)
3. [Rendering elements](#rendering-elements)
4. [Mounting elements](#mounting-elements)
5. [Localization](#localization)
6. [Remote procedure call](#remote-procedure-call)
7. [Simple routing](#simple-routing)
8. [Use with Twind](#use-with-twind)
9. [Use with UnoCSS](#use-with-unocss)
10. [Build with Vite](#use-with-vite)
11. [Use with Tailwind CSS](#use-with-tailwind-css)
12. [Use with daisyUI](#use-with-daisyui)
13. [Use with Web Components](#use-with-web-components)
14. [Create your own Web Component](#create-your-own-web-component)
15. [Examples](#examples)

## Getting started

Let's look at how to get started with NEUX. 

You can use it from the browser without any build step:

```html
<script src="https://unpkg.com/neux"></script>
<script>
  const { render, h, mount, signal, effect, l10n, rpc } = neux;
  // use the library here...
</script>
```

The library has several functions that can be used to build declarative with reactive signals defined HTML elements.

```js
const { render, signal, mount, l10n } = neux;

const t = l10n({
  en: { count: 'Count: %{val}' },
  ru: { count: 'Счет: %{val}' }
});

const state = signal({ count: 1 });

const el = render({
  children: [{
    signals: [state],
    tag: 'button',
    classList: ['btn'],
    textContent: () => t('count', { val: state.$count }),
    on: {
      click: (e) => state.count++
    }
  }]
});

mount(el, document.body);
```

## HyperScript-like syntax

You can use HyperScript-like syntax to render HTML elements with the `h()` function.

```js
import { render: h, signal, mount } from 'neux';

const state = signal({ count: 1 });

const el = h('div', [
  h('button', {
    signals: [state],
    classList: ['btn'],
    on: {
      click: (e) => state.count++
    }
  }, () => state.$count)
]);

mount(el, document.body);
```

## Signals

The state is a proxy for objects. States are used to track changes and distribute them to related views and other state fields.

An example with comments:

```js
// create a reactive state from object
const state = signal({
  // regular fields
  counter: 1,
  multiplier: 2,
  // the field as array
  list: [
    { text: 'Item 1' },
    { text: 'Item 2', checked: true }
  ],
  // the computed field for an object
  double: (obj, prop) => obj.$counter * 2,
  // the computed field for an array
  filtered: (obj, prop) => {
    return obj.$list.filter(item => item.checked);
  },
  // subscribe to track changes to the "double" field
  $double: (newv, oldv, prop, obj) => {
    console.log(newv, oldv, prop, obj);
  },
  // subscribe to track any object changes
  $: (newv, oldv, prop, obj) => {
    console.log(newv, oldv, prop, obj);
  }
});
// set or change the computed field
state.double = (obj, prop) => state.$counter * state.$multiplier;
// change the regular field
state.counter++;
state.list.push({ text: 'Item 3' });
// remove the field with all listeners
delete state.double;
```

The `$` character ahead of a field name is used in computed fields to observe its changes. When changes occur in this field, this function will automatically recalled and receives the new value of the computed field.

> **ATTENTION**
> - When deleting or replacing the tracking object/array in the computed field, all binding is lost.
> - In computed fields, binding occurs only with those fields that are called during the first synchronous execution.

Effect is ...

```js
const displose = effect(() => {
  // getter with reactivity
  const { $count } = state;
  return $count * 2; 
}, (value) => {
  // setter without reactivity
  console.log(value);
}, () => {
  // cleanup when dispose is called
});
// clear all reactivity subscriptions
// dispose();
```

Listening for state changes:

```js
const handler = (newv, oldv, prop, obj) => {
  console.log(newv, oldv, prop, obj);
  if (newv === undefined) {
    console.log('deleted');
  } else if (oldv === undefined) {
    console.log('added');
  } else {
    console.log('updated');
  }
};
// add a specified listener
state.$$on('double', handler);
// add a specified listener that only calls once
state.$$once('double', handler);
// remove a specified listener
state.$$off('double', handler);
// remove all listeners for the specified field
state.$$off('double');
// add a listener to observe any changes
// on this object and all children
state.$$on('*', handler);
```

## Rendering elements

You can create HTML elements by declarative definition using plain JS objects and functions.

| Field        | Value                           |
|--------------|---------------------------------|
| tag          | string or Element               | 
| namespaceURI | string                          |
| classList    | string[] or function            |
| attributes   | object or function              |
| style        | object or function              |
| dataset      | object or function              |
| on           | object                          |
| children     | string or Element[] or function |
| ref          | function                        |

An example with comments:

```js
// create a reactive state
const state = signal({
  list: [
    { text: 'Item 1' },
    { text: 'Item 2', checked: true },
    { text: 'Item 3' }
  ]
});
// create an HTML element from a declarative definition
const el = render({
  context: state,
  children: [{
    tag: 'h1',
    textContent: 'To Do'
  }, {
    tag: 'input',
    placeholder: 'Enter your task...',
    autofocus: true,
    on: {
      keyup(ctx, e) {
        e.preventDefault();
        ctx.list.push({ text: e.target.value });
        e.target.value = '';
      }
    }
  }, {
    children: [{
      tag: 'input',
      type: 'checkbox',
      on: {
        change(ctx, e) {
          const checked = e.target.checked;
          ctx.list.forEach((item) => {
            item.checked = checked;
          });
        }
      }
    }, {
      tag: 'label',
      textContent: 'Mark all as complete'
    }]
  }, {
    tag: 'ul',
    children: (ctx) => {
      // redraw the list if any child element is added, replaced or removed
      // any updates inside children are ignored
      return ctx.list.$$each(item => {
        return {
          tag: 'li',
          context: item,
          children: [{
            tag: 'input',
            type: 'checkbox',
            checked: (ctx) => ctx.$checked,
            on: {
              change(ctx, e) {
                ctx.checked = e.target.checked;
              }
            }
          }, {
            tag: 'label',
            textContent: (ctx) => ctx.$text
          }, {
            tag: 'a',
            href: '#',
            textContent: '[x]',
            on: {
              click(ctx, e) {
                e.preventDefault();
                const index = ctx.list.indexOf(item);
                ctx.list.splice(index, 1);
              }
            }
          }]
        };
      });
    }
  }, {
    textContent: (ctx) => `Total items: ${ctx.list.$length}`
  }]
});
// mount the element to the DOM
mount(el, document.body);
// remove from the DOM
// el.remove();
```

You can include any SVG icon as HTML markup and change its styles (size, color) via the `classList` or `attributes` field:

```js
import githubIcon from '@svg-icons/fa-brands/github.svg?raw';

const svgElement = render({
  tag: githubIcon,
  classList: ['icon'],
  attributes: {
    width: '64px',
    height: '64px'
  }
});
```

## Mounting elements

You can use the `mount()` function to mount element to the DOM. 

Additional events for each element:

- `mounted` - the element was added to the DOM;
- `removed` - the element was removed from the DOM;
- `changed` - the element attribute was changed.

```js
const el = render({
  on: {
    mounted(e) {},
    changed(e) {},
    removed(e) {}
  },
  textContent: 'Hello World!'
});

mount(el, document.body);
```

## Localization

Localization is used to display the application interface in different languages.You can use localized number and date formatting with [Intl.NumberFormat](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) and [Intl.DateTimeFormat](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).

Translation example:

```js
const t = l10n({
  en: {
    say: {
      hello: "Hello %{name}!"
    },
    number: 'number: %{val}',
    date: 'date: %{val}'
  },
  ru: {
    say: {
      hello: "Привет %{name}!"
    },
    number: 'число: %{val}',
    date: 'дата: %{val}'
  }
}, {
  language: navigator.language,
  fallback: 'en'
});

const msgEn = t('say.hello', { name: 'World' });
console.log(msgEn); // Hello World!

const numberMsg = t('number', {
  val: [12345, {
    style: 'currency',
    currency: 'USD'
  }]
});
console.log(numberMsg); // number: $12,345.00

const dateMsg = t('date', {
  val: [new Date('2025-01-15'), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }]
});
console.log(dateMsg); // date: Wednesday, January 15, 2025

const msgRu = t('say.hello', { name: 'Мир' }, 'ru');
console.log(msgRu); // Привет Мир!
```

## Simple routing

You can use `signal()` and `render()` functions with condition for children field to create a simple routing in your application.

An example with comments:

```js
const state = signal({
  path: 'Home',
});

const Home = () => {
  return {
    textContent: 'Home',
  };
};

const About = () => {
  return {
    textContent: 'About',
  };
};

const NotFound = () => {
  return {
    textContent: 'Not found',
  };
};

const views = { Home, About };

const el = render({
  children: [{
    tag: 'nav',
    children: [{
      tag: 'a',
      href: '#Home',
      textContent: 'Home',
    }, {
      tag: 'a',
      href: '#About',
      textContent: 'About',
    }, {
      tag: 'a',
      href: '#Blog',
      textContent: 'Blog',
    }],
  }, {
    tag: 'main',
    children: () => {
      const View = views[state.$path];
      return View ? View() : NotFound();
    },
  }],
});

window.addEventListener('hashchange', () => {
  state.path = location.hash.slice(1);
});

mount(el, document.body);
```

## Remote procedure call

RPC is short for Remote Procedure Call. This abstraction allows you to execute code on the backend by calling normal functions on the frontend.

Here is an example of calling some function:

```js
// create RPC client
const api = rpc({ url: '/api/rpc' });
// define input parameters
const text = 'Text'; // as text
const object = { text }; // as object
const blob = new Blob([text]); // as blob
const file = new File([blob], 'file.txt'); // as file
const formData = new FormData(); // as form-data
formData.append('file', file);
// call the remote function named "hello"
const response = await api.hello(/* params */);
console.log(response);
```

The function can accept input parameters in the formats `String`, `Object`, `Blob`, `File` or `FormData`. The function response can be one of three types `String`, `Object` or `Blob`.

The default backend request HTTP method is `POST`. The API address on the backend has the format `/api/rpc/:method`, where `:method` is the name of the function to run.

The request can be of the following types:

- `application/json` - format for passing JavaScript objects.
- `multipart/from-data` - file transfer format.
- `text/plain` - all non-objects are passed as text.

The response must be of the following types:

- `application/json` - format for passing JavaScript objects.
- `application/octet-stream` - file transfer format.
- `text/plain` - all non-objects are passed as text.

Below is an example of using RPC for some imaginary backend:

```js
let token = '';
// create RPC client
const api = rpc({
  // RPC backend endpoint
  url: '/api/rpc',
  // include headers for every request
  headers: {
    // getter for authorization header
    get Authorization() {
      return token && `Bearer ${token}`;
    }
  },
  // include cookies for every request
  // credentials: 'include',
  // enable CORS for requests
  // mode: 'cors'
});
// authorize and get the session token
token = await api.login({ username, password });
// upload file from <input id="file" type="file" />
const file = document.getElementById('file').files[0];
const { id, name, type, size } = await api.upload(file);
// send json data
const res = await api.addComment({
  author: 'John Doe',
  text: 'Hello World!',
  time: new Date(),
  attachments: [id]
});
// update data
await api.updateComment({
  id: res.id,
  text: 'Edited message'
});
// receive json data
const comment = await api.getComment({
  id: res.id
});
```

Below is an example implementation of the server API for RPC on Node.js:

```js
// server.js
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import { Readable } from 'node:stream';
import express from 'express';
import multer from 'multer';

const { PORT = 3000, HOST = '127.0.0.1' } = process.env;
const upload = multer({ dest: os.tmpdir() });
const app = express();

app.enable('trust proxy');
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(express.json());

const todos = [];
const handlers = {
  async hello (name) {
    return `Hello ${name}!`;
  },
  async time () {
    return { time: new Date() };
  },
  async upload (file) {
    return file;
  },
  async download (path) {
    return fs.createReadStream(path);
  }
};

app.post('/api/rpc/:method',
  upload.single('file'),
  async function (req, res, next) {
    try {
      const { method } = req.params;
      const params = req.file || req.body;
        const handler = handlers[method];
        if (typeof handler !== 'function') {
          throw Error('Method not found');
        }
        const data = await handler(params);
      if (data instanceof Readable) {
        res.set('Content-Type', 'application/octet-stream');
        data.on('error', () => res.end());
        return data.pipe(res);
      }
      if (typeof data === 'object') {
        res.set('Content-Type', 'application/json');
        return res.json(data);
      }
      res.set('Content-Type', 'text/plain');
      res.send(data);
    } catch (err) {
      next(err);
    }
  });

http.Server(app).listen(PORT, HOST);
```

You can start the server like this:

```sh
npm install express multer
node server.js
```

And an example of calling RPC methods in NEUX:

```js
const api = rpc({ url: '/api/rpc' })
api.hello('World').then(data => {
  console.log('hello:', data);
});
api.time().then(data => {
  console.log('time:', data);
});
api.download('/tmp/test').then(data => {
  console.log('download:', data);
});
const blob = new Blob(['Hello World!']);
const file = new File([blob], 'demo.txt');
api.upload(file).then(data => {
  console.log('upload:', data);
});
```

## Use with Vite

You can use NEUX with [Vite](https://vitejs.dev) bundler.

How to set up:

**1.** Create a new Vite project (select a variant JavaScript):

```sh
npm init vite@latest
```

**2.** Install the `neux` module:

```sh
npm install --save-dev neux
```

**3.** Paste your application code into the `main.js` file:

```js
import { createView } from 'neux';

createView({
  textContent: 'Hello World!'
}, { target: document.body });
```

**4.** Run the project:

```sh
npm run dev
```

## Use with Tailwind CSS

It also fits well with [Tailwind CSS](https://tailwindcss.com). After [installing Tailwind CSS](https://tailwindcss.com/docs/installation) into your project you can use CSS classes in the `classList` field as `String` or `Array`.

How to set up your Vite project:

**1.** Install the required modules:

```sh
npm install --save-dev tailwindcss postcss autoprefixer
```

**2.** Create the file `tailwind.config.js`:

```js
export default {
  content: ['./index.html', './main.js'],
  theme: {
    extend: {}
  },
  plugins: []
};
```

**3.** Create the file `postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
```

**4.** Replace the contents of the `style.css` file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**5.** Replace the contents of the `main.js` file with the example:

```js
import './style.css';
import { createView } from 'neux';

createView({
  tagName: 'h1',
  classList: ['text-3xl', 'font-bold', 'underline'],
  textContent: 'Hello world!'
}, { target: document.body });
```

## Use with daisyUI

To simplify styles you can use [daisyUI](https://daisyui.com). This is a popular component library for [Tailwind CSS](https://tailwindcss.com).

How to set up your Tailwind CSS project:

**1.** Install the required modules:

```sh
npm install --save-dev daisyui @tailwindcss/typography
```

**2.** Change the file `tailwind.config.js`:

```js
import daisyui from 'daisyui';
import typography from '@tailwindcss/typography';

export default {
  // ...
  plugins: [typography, daisyui]
};
```

**3.** Replace the contents of the `main.js` file with the example:

```js
import './style.css';
import { createState, createView } from 'neux';

const state = createState({ counter: 0 });

createView({
  classList: ['container', 'm-auto', 'p-8', 'flex', 'gap-4'],
  children: [{
    tagName: 'button',
    classList: ['btn', 'btn-primary'],
    textContent: '-1',
    on: {
      click() {
        return () => state.counter--;
      }
    }
  }, {
    tagName: 'input',
    type: 'number',
    classList: ['input', 'input-bordered', 'w-full'],
    value: () => state.$counter,
    on: {
      change() {
        return ({ target }) => state.counter = parseInt(target.value);
      }
    }
  }, {
    tagName: 'button',
    classList: ['btn', 'btn-primary'],
    textContent: '+1',
    on: {
      click() {
        return () => state.counter++;
      }
    }
  }]
}, { target: document.body });
```

## Use with Web Components

You can use NEUX along with any [Web Components](https://developer.mozilla.org/docs/Web/API/Web_Components). Many component libraries can be [found here](https://open-wc.org/guides/community/component-libraries/).

Let's take an example of working with the [BlueprintUI](https://blueprintui.dev) library:

**1.** Install the required modules:

```sh
npm install --save-dev @blueprintui/components @blueprintui/themes @blueprintui/layout @blueprintui/typography
```

**2.** Import styles in the `style.css` file:

```css
@import '@blueprintui/layout/index.min.css';
@import '@blueprintui/typography/index.min.css';
@import '@blueprintui/themes/index.min.css';
```

**3.** Replace the contents of the `main.js` file with the example:

```js
import { createView } from 'neux';
import './style.css';
import '@blueprintui/components/include/button.js';
import '@blueprintui/components/include/card.js';
import '@blueprintui/components/include/input.js';

createView({
  tagName: 'bp-card',
  children: [{
    tagName: 'h2',
    slot: 'header',
    attributes: {
      'bg-text': 'section'
    },
    textContent: 'Heading'
  }, {
    tagName: 'bp-field',
    children: [{
      tagName: 'label',
      textContent: 'label'
    }, {
      tagName: 'bp-input'
    }]
  }, {
    slot: 'footer',
    attributes: {
      'bp-layout': 'inline gap:xs inline:end'
    },
    children: [{
      tagName: 'bp-button',
      attributes: {
        action: 'secondary'
      },
      textContent: 'Cancel'
    }, {
      tagName: 'bp-button',
      attributes: {
        status: 'accent'
      },
      textContent: 'Confirm'
    }]
  }]
}, { target: document.body });
```

## Create your own Web Component

You can create your own components using [one of the libraries](https://open-wc.org/guides/community/base-libraries/), for example [Lit](https://lit.dev). But you can also create your own Web Components using NEUX.

An example of a web component definition:

```js
class Counter extends HTMLElement {
  static get observedAttributes() {
    return ['value'];
  }
  constructor() {
    super();
    const target = this.attachShadow({ mode: 'open' });
    const context = {};
    this.state = createState(this.data(), { context });
    const el = createElement(this.config(), { context });
    target.appendChild(el);
  }
  data() {
    return {
      value: '',
      $: (newv, oldv, prop) => this.setAttribute(prop, newv)
    };
  }
  config() {
    return {
      children: () => [{
        tagName: 'input',
        type: 'number',
        value: () => this.state.$value,
        on: {
          change(e) {
            this.state.value = e.target.value;
          }
        }
      }, {
        tagName: 'slot',
        name: 'label',
        textContent: () => this.state.$value
      }]
    };
  }
  attributeChangedCallback(name, oldv, newv) {
    this.state[name] = newv;
  }
}
customElements.define('ne-counter', Counter);
```

Use this web component:

```js
const state = createState({
  counter: 1
});
createView({
  tagName: 'ne-counter',
  attributes: {
    value: () => state.$counter,
  },
  on: {
    changed() {
      return (e) => {
        state.counter = parseInt(e.detail.newValue);
      };
    }
  },
  children: [{
    tagName: 'span',
    slot: 'label',
    textContent: () => state.$counter
  }]
}, { target: document.body });
```

## Examples

You can find development examples with NEUX in the following repositories:

- [neux-todo-app](https://github.com/meefik/neux-todo-app) - example To-Do application on NEUX + Tailwind CSS + Vite;
- [neux-demo](https://github.com/meefik/neux-demo) - various examples on NEUX.
