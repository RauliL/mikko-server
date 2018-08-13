import { mount } from 'redom';

import App from './app';

import '../node_modules/bulma/bulma.sass';

window.addEventListener(
  'DOMContentLoaded',
  () => mount(document.body, new App())
);
