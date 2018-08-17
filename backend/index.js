const express = require('express');
const path = require('path');
const winston = require('winston');

const oddcast = require('./oddcast');

const { isBlank, isValidNick } = require('../common/utils');

const clientRegistry = require('./client-registry');

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

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
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static('public'));

app.get('/', (req, res) => res.render('index', {
  voices: oddcast.listAllVoices()
}));

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

    const voiceConfig = oddcast.findVoiceByName(voice);

    if (!voiceConfig) {
      log.error(`${client.nick} tried to use unrecognized voice: \`${voice}'`);
      socket.emit('client error', 'Unrecognized voice.');
      return;
    }

    log.info(`${client.nick} (as ${voice}): ${text}`);
    oddcast.retrieve(text, voiceConfig)
      .then((hash) => {
        io.emit('say', {
          nick: client.nick,
          text,
          hash
        });
      })
      .catch((err) => {
        log.error(err);
        io.emit('client error', 'Unable to say that.');
      });
  });
});

http.listen(PORT, () => {
  log.info(`Listening on port ${PORT}.`);
});
