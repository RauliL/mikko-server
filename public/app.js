window.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const voiceField = document.getElementById('field-voice');
  const voiceInput = document.getElementById('voice');
  const textInput = document.getElementById('text');
  const textLabel = document.getElementById('label-text');
  const submit = document.querySelector('button[type=submit]');
  const isBlank = RegExp.prototype.test.bind(/^\s*$/);
  const socket = window.io();
  const logContainer = document.querySelector('#log nav.panel');
  const queue = [];
  let isPlaying = false;
  let isJoined = false;

  const log = (text) => {
    const block = document.createElement('div');

    block.classList.add('panel-block');
    if (typeof text === 'object' && text.nodeType === 1) {
      block.appendChild(text);
    } else {
      block.innerText = `${moment().format('HH:MM:SS')} ${text}`;
    }
    if (logContainer.firstChild) {
      logContainer.insertBefore(block, logContainer.firstChild);
    } else {
      logContainer.appendChild(block);
    }
  };

  const notify = (text, color) => {
    const notification = document.createElement('div');

    notification.classList.add('notification');
    if (color) {
      notification.classList.add(`is-${color}`);
    }
    notification.innerText = text;
    log(notification);
  };

  const playFromQueue = () => {
    if (isPlaying || !queue.length) {
      return;
    }

    const hash = queue[0];
    const audio = new Audio();

    isPlaying = true;
    queue.shift();
    audio.src = `/say/${hash}`;
    audio.addEventListener('ended', () => {
      isPlaying = false;
      if (queue.length > 0) {
        playFromQueue();
      }
    });
    audio.play();
  };

  voiceField.style.display = 'none';
  textLabel.innerText = 'Nick';
  submit.innerText = 'Join';

  voiceInput.addEventListener('change', () => {
    textInput.focus();
  });

  form.addEventListener('submit', (ev) => {
    const voice = voiceInput.value;
    const text = textInput.value;

    ev.preventDefault();
    if (isJoined) {
      if (!isBlank(voice) && !isBlank(text)) {
        socket.emit('say', voice, text);
      }
    } else if (!isBlank(text)) {
      socket.emit('join', text);
    }
    textInput.value = '';
    textInput.focus();
  });

  socket.on('welcome', () => {
    isJoined = true;
    voiceField.style.display = 'block';
    textLabel.innerText = 'Text';
    submit.innerText = 'Send';
  });

  socket.on('err', (message) => {
    notify(message, 'danger');
  });

  socket.on('join', (nick) => {
    log(`Joins: ${nick}`);
  });

  socket.on('quit', (nick) => {
    log(`Quit: ${nick}`);
  });

  socket.on('say', (nick, text, hash) => {
    log(`<${nick}> ${text}`);
    queue.push(hash);
    if (!isPlaying) {
      playFromQueue();
    }
  });
});
