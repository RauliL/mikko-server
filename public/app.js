window.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const voiceField = document.getElementById('field-voice');
  const voiceInput = document.getElementById('voice');
  const textInput = document.getElementById('text');
  const textLabel = document.getElementById('label-text');
  const submit = document.querySelector('button[type=submit]');
  const isBlank = RegExp.prototype.test.bind(/^\s*$/);
  const socket = window.io();
  const logContainer = document.getElementById('log');
  const usersContainer = document.getElementById('users');
  const queue = [];
  const users = {};
  let isPlaying = false;
  let isJoined = false;

  const log = (text) => {
    const block = document.createElement('li');

    if (typeof text === 'object' && text.nodeType === 1) {
      block.appendChild(text);
    } else {
      block.innerText = `${moment().format('HH:MM:ss')} ${text}`;
    }
    if (logContainer.children.length === 50) {
      logContainer.removeChild(logContainer.lastChild);
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

  const updateUserList = () => {
    const sortedUsers = Object.keys(users)
      .map((id) => users[id])
      .sort((a, b) => a > b ? 1 : a < b ? -1 : 0);
    const heading = document.createElement('p');

    usersContainer.innerHTML = '';
    heading.classList.add('panel-heading');
    heading.innerText = `${sortedUsers.length} connected user(s)`;
    usersContainer.appendChild(heading);
    sortedUsers.forEach((nick) => {
      const div = document.createElement('div');

      div.classList.add('panel-block');
      div.innerText = nick;
      usersContainer.appendChild(div);
    });
  };

  const addConnectedUser = (id, nick) => {
    if (!users[id]) {
      users[id] = nick;
      updateUserList();
    }
  };

  const removeConnectedUser = (id, nick) => {
    if (users[id]) {
      delete users[id];
      updateUserList();
    }
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

  socket.on('welcome', (connectedUsers) => {
    isJoined = true;
    voiceField.style.display = 'block';
    textLabel.innerText = 'Text';
    submit.innerText = 'Send';
    connectedUsers.forEach((user) => addConnectedUser(user.id, user.nick));
  });

  socket.on('err', (message) => {
    notify(message, 'danger');
  });

  socket.on('join', (id, nick) => {
    log(`Joins: ${nick}`);
    addConnectedUser(id, nick);
  });

  socket.on('quit', (id, nick) => {
    log(`Quit: ${nick}`);
    removeConnectedUser(id, nick);
  });

  socket.on('say', (nick, text, hash) => {
    log(`<${nick}> ${text}`);
    queue.push(hash);
    if (!isPlaying) {
      playFromQueue();
    }
  });
});
