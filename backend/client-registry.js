const uuid = require('uuid');

const connectedClients = {};

module.exports.getClientsWithNick = () => (
  Object.values(connectedClients).filter((client) => client.nick)
);

module.exports.findClientByNick = (nick) => (
  Object.values(connectedClients).find((client) => client.nick === nick)
);

module.exports.registerClient = () => {
  const client = {
    id: uuid.v1(),
    nick: null
  };

  connectedClients[client.id] = client;

  return client;
};

module.exports.unregisterClient = (client) => {
  delete connectedClients[client.id];
};
