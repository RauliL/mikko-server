const buildUrl = require('build-url');
const express = require('express');
const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const request = require('request');
const uuid = require('uuid');
const winston = require('winston');

const { isBlank, isValidNick } = require('../common/utils');

const clientRegistry = require('./client-registry');

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

app.set('view engine', 'pug');
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.render('index', { voices: Object.keys(VOICE_CONFIGURATIONS) });
});

app.get('/say/:hash', (req, res) => res.sendFile(
  `${req.params.hash}.mp3`,
  { root: path.join(__dirname, '..', 'cache') }
));

io.on('connection', (socket) => {
  const client = clientRegistry.registerClient();

  socket.on('disconnect', () => {
    clientRegistry.unregisterClient(client);
    if (client.nick) {
      log.info(`Quit: ${client.nick}`);
      io.emit('quit', client);
    }
  });

  socket.on('join', (nick) => {
    if (!isValidNick(nick)) {
      socket.emit('client error', 'Invalid nickname.');
      return;
    }
    if (client.nick) {
      socket.emit('client error', 'You already have a nickname.');
      return;
    }
    if (clientRegistry.findClientByNick(nick)) {
      socket.emit('client error', 'That nickname has already been taken.');
      return;
    }
    client.nick = nick;
    log.info(`Join: ${nick}`);
    io.emit('join', client);
    socket.emit('welcome', clientRegistry.getClientsWithNick());
  });

  socket.on('say', ({ text, voice }) => {
    if (!client.nick) {
      return;
    }

    if (isBlank(text)) {
      socket.emit('client error', 'Empty message.');
      return;
    } else if (isBlank(voice)) {
      socket.emit('client error', 'No voice given.');
      return;
    }

    const voiceConfig = VOICE_CONFIGURATIONS[voice];

    if (!voiceConfig) {
      log.error(`${client.nick} tried to use unrecognized voice: \`${voice}'`);
      socket.emit('client error', 'Unrecognized voice.');
      return;
    }

    log.info(`${client.nick} (as ${voice}): ${text}`);

    const hash = buildHash(text, voiceConfig);
    const file = path.join(__dirname, '..', 'cache', `${hash}.mp3`);

    if (fs.existsSync(file)) {
      io.emit('say', {
        nick: client.nick,
        text,
        hash
      });
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
        io.emit('client error', 'Unable to say that.');
      })
      .pipe(fs.createWriteStream(file))
      .on('close', () => {
        io.emit('say', {
          nick: client.nick,
          text,
          hash
        });
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
