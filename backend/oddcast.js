const { buildHash, buildUrl, languages, voices } = require('oddcast-tts-demo');
const fs = require('fs');
const { values } = require('lodash');
const path = require('path');
const request = require('request');

const { ignoreCaseCompare } = require('../common/utils');

module.exports.listAllVoices = () => {
  const mapping = {};

  values(languages).forEach((language) => {
    mapping[language.name] = values(voices)
      .filter((voice) => voice.language === language)
      .sort((a, b) => ignoreCaseCompare(a.name, b.name));
  });

  return mapping;
};

module.exports.findVoiceByName = (name) => (
  values(voices).find((voice) => voice.name === name)
);

module.exports.retrieve = (text, voice) => new Promise((resolve, reject) => {
  const hash = buildHash(text, voice);
  const file = path.join(__dirname, '..', 'cache', `${hash}.mp3`);

  if (fs.existsSync(file)) {
    resolve(hash);
    return;
  }

  request(buildUrl(text, voice, hash))
    .on('error', reject)
    .on('response', (response) => {
      if (response.statusCode !== 200 ||
          response.headers['content-type'] !== 'audio/mpeg') {
        reject(new Error('Server didn\'t return any audio'));
        return;
      }

      response
        .pipe(fs.createWriteStream(file))
        .on('close', () => resolve(hash));
    });
});
