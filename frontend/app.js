import { el, setChildren } from 'redom';

import AudioQueue from './audio-queue';
import ChatView from './chat-view';
import { listen } from './dispatch';
import LoginView from './login-view';

export default class App {
  constructor () {
    this.el = el('.container',
      { style: { paddingTop: '1em' } },
      this.loginView = new LoginView()
    );
    this.queue = new AudioQueue();
  }

  onmount () {
    listen(this);
    this.installSocket();
  }

  onunmount () {
    this.uninstallSocket();
  }

  installSocket () {
    const socket = window.io();

    this.socket = socket;

    socket.on('welcome', (users) => {
      this.chatView = new ChatView(this.nick);
      setChildren(this.el, this.chatView);
      delete this.loginView;
      users.forEach(({ id, nick }) => this.chatView.users.add(id, nick));
    });

    socket.on('client error', (message) => {
      console.error(message);
      if (this.chatView) {
        this.chatView.log.add(message, 'danger');
      } else if (this.loginView) {
        this.loginView.setErrorMessage(message);
      }
    });

    socket.on('join', ({ id, nick }) => {
      if (this.chatView) {
        this.chatView.log.add(`Join: ${nick}`);
        this.chatView.users.add(id, nick);
      }
    });

    socket.on('quit', ({ id, nick }) => {
      if (this.chatView) {
        this.chatView.log.add(`Quit: ${nick}`);
        this.chatView.users.remove(id);
      }
    });

    socket.on('say', ({ nick, text, hash }) => {
      if (this.chatView) {
        this.chatView.log.add(`<${nick}> ${text}`);
      }
      this.queue.add(`/say/${hash}`);
    });
  }

  uninstallSocket () {
    if (this.socket) {
      this.socket.close();
      delete this.socket;
    }
  }

  onNickGiven ({ nick }) {
    this.nick = nick;
    this.socket.emit('join', nick);
  }

  onSay ({ text, voice }) {
    this.socket.emit('say', { text, voice });
  }
}
