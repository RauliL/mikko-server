import moment from 'moment';
import { el } from 'redom';

const TIMESTAMP_FORMAT = 'HH:mm:ss';

export default class MessageLog {
  constructor () {
    this.el = el('ul', {
      style: {
        fontFamily: 'monospace',
        listStyle: 'none',
        overflowY: 'auto'
      }
    });
  }

  add (message, color = null) {
    const li = el('li', `${moment().format(TIMESTAMP_FORMAT)} ${message}`);

    if (color) {
      li.classList.add(`is-${color}`);
    }
    if (this.el.children.length === 49) {
      this.el.removeChild(this.el.lastChild);
    }
    if (this.el.firstChild) {
      this.el.insertBefore(li, this.el.firstChild);
    } else {
      this.el.appendChild(li);
    }
  }
}
