import { trim } from 'lodash';
import { el } from 'redom';

import { isValidNick } from '../common/utils';

import { dispatch } from './dispatch';

export default class LoginView {
  constructor () {
    this.el = el('form',
      el('.field',
        el('label', 'Please choose a nickname'),
        el('.control',
          this.input = el('input.input', { type: 'text' })
        ),
        this.help = el('p.help.is-invisible')
      ),
      el('.control',
        el('button.button', 'Join chat')
      )
    );

    this.el.addEventListener('submit', (ev) => {
      const nick = trim(this.input.value);

      ev.preventDefault();
      if (!isValidNick(nick)) {
        this.setErrorMessage('Please give a valid nickname.');
        return;
      }

      dispatch(this, 'nickGiven', { nick });
    });
  }

  onmount () {
    this.input.focus();
  }

  setErrorMessage (message) {
    this.input.classList.add('is-danger');
    this.help.classList.add('is-danger');
    this.help.classList.remove('is-invisible');
    this.help.innerText = message;
  }
}
