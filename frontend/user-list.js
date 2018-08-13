import { values } from 'lodash';
import { el } from 'redom';

import { ignoreCaseCompare } from '../common/utils';

export default class UserList {
  constructor () {
    this.users = {};
    this.el = el('nav.panel');
  }

  update () {
    const nicks = values(this.users).sort(ignoreCaseCompare);

    this.el.innerHTML = '';
    this.el.appendChild(el('p.panel-heading', `${nicks.length} user(s)`));
    nicks.forEach((nick) => this.el.appendChild(el('.panel-block', nick)));
  }

  add (id, nick) {
    if (!this.users[id]) {
      this.users[id] = nick;
      this.update();
    }
  }

  remove (id) {
    if (this.users[id]) {
      delete this.users[id];
      this.update();
    }
  }
}
