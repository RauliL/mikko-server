import { el } from 'redom';

import { isBlank } from '../common/utils';

import { dispatch } from './dispatch';
import MessageLog from './message-log';
import UserList from './user-list';

export default class ChatView {
  constructor (ownNickName) {
    this.el = el('.columns',
      el('.column.is-9',
        this.form = el('form.columns',
          this.nick = el('.column.is-narrow.is-size-5', `${ownNickName}: `),
          el('.column', el('.field', el('.control',
            this.input = el('input.input', { type: 'text' })
          ))),
          el('.column', el('.field', el('.control', el('.select',
            this.voice = el('select',
              Object.keys(window.VOICES).map((language) => el(
                'optgroup',
                { label: language },
                window.VOICES[language].map((voice) => el(
                  'option',
                  { value: voice.name },
                  voice.dialect
                    ? `${voice.name} (${voice.dialect})`
                    : voice.name
                ))
              ))
            )
          ))))
        ),
        this.log = new MessageLog()
      ),
      el('.column', { style: { overflowY: 'auto' } },
        this.users = new UserList()
      )
    );

    this.voice.value = 'Mikko';
    this.voice.addEventListener('change', () => this.input.focus());

    this.form.addEventListener('submit', (ev) => {
      const text = this.input.value;
      const voice = this.voice.value;

      ev.preventDefault();
      if (!isBlank(text) && !isBlank(voice)) {
        dispatch(this, 'say', { text, voice });
      }
      this.input.value = '';
      this.input.focus();
    });
  }

  onmount () {
    this.input.focus();
  }
}
