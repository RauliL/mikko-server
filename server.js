const buildUrl = require('build-url');
const express = require('express');
const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const request = require('request');
const uuid = require('uuid');
const winston = require('winston');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const VOICE_CONFIGURATIONS = {
  mikko: {
    engine: 4,
    language: 23,
    voice: 1
  },
  milla: {
    engine: 2,
    language: 23,
    voice: 1
  },
  marko: {
    engine: 2,
    language: 23,
    voice: 2
  },
  alan: {
    engine: 2,
    language: 1,
    voice: 9
  }
};

// Configure logging.
const log = winston.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) =>
          `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    })
  ]
});

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const connectedClients = {};
const isBlank = RegExp.prototype.test.bind(/^\s*$/);
const isValidNick = RegExp.prototype.test.bind(/^[a-zA-Z0-9_]{1,15}$/);

app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', { voices: Object.keys(VOICE_CONFIGURATIONS) });
});

app.get('/say/:hash', (req, res) => res.sendFile(
  `${req.params.hash}.mp3`,
  { root: path.join(__dirname, 'tmp') }
));

io.on('connection', (socket) => {
  const id = uuid.v1();
  const client = { id, socket };

  connectedClients[id] = client;

  socket.on('disconnect', () => {
    delete connectedClients[id];
    if (client.nick) {
        log.info(`Quit: ${client.nick}`);
        io.emit('quit', client.nick);
    }
  });

  socket.on('join', (nick) => {
    if (!isValidNick(nick)) {
      socket.emit('err', 'Invalid nick.');
      return;
    }
    if (client.nick) {
      socket.emit('err', 'You already have a nick.');
      return;
    }
    client.nick = nick;
    log.info(`Join: ${nick}`);
    io.emit('join', nick);
    socket.emit('welcome');
  });

  socket.on('say', (voice, text) => {
    if (!client.nick) {
      return;
    }

    if (isBlank(text)) {
      socket.emit('err', 'Empty message.');
      return;
    } else if (isBlank(voice)) {
      socket.emit('err', 'No voice given');
      return;
    }

    const voiceConfig = VOICE_CONFIGURATIONS[voice];

    if (!voiceConfig) {
      log.error(`${client.nick} tried to use unrecognized voice: \`${voice}'`);
      socket.emit('err', 'Unrecognized voice.');
      return;
    }

    log.info(`${client.nick} (as ${voice}): ${text}`);

    const hash = buildHash(text, voiceConfig);
    const file = path.join(__dirname, 'tmp', `${hash}.mp3`);

    if (fs.existsSync(file)) {
      io.emit('say', client.nick, text, hash);
      return;
    }

    const url = buildUrl('http://cache-a.oddcast.com', {
      path: `c_fs/${hash}.mp3`,
      queryParams: {
        engine: voiceConfig.engine,
        language: voiceConfig.language,
        voice: voiceConfig.voice,
        text,
        useUTF8: 1
      }
    });

    request(url)
      .on('error', (err) => {
        log.error(err);
        io.emit('err', 'Unable to say that.');
      })
      .pipe(fs.createWriteStream(file))
      .on('close', () => {
        io.emit('say', client.nick, text, hash);
      });
  });
});

http.listen(PORT, () => {
  log.info(`Listening on port ${PORT}.`);
});

function buildHash(text, voiceConfig) {
  const { engine, language, voice } = voiceConfig;
  const fragments = [
    `<engineID>${engine}</engineID>`,
    `<voiceID>${voice}</voiceID>`,
    `<langID>${language}</langID>`,
    '<ext>mp3</ext>',
    text
  ];

  return md5(fragments.join(''));
}
