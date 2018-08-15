const buildUrl = require('build-url');
const fs = require('fs');
const md5 = require('md5');
const path = require('path');
const request = require('request');

const languageCodeMapping = {
  1: 'English',
  23: 'Finnish',
  9: 'Swedish'
};

const voicesByName = {};
const voicesByLanguage = {};

const registerVoice = (voice) => {
  const languageName = languageCodeMapping[voice.language];

  voicesByName[voice.name] = voice;
  if (!voicesByLanguage[languageName]) {
    voicesByLanguage[languageName] = [];
  }
  voicesByLanguage[languageName].push(voice.name);
};

module.exports.listAllVoices = () => voicesByLanguage;
module.exports.findVoiceByName = (name) => voicesByName[name];

[
  // Finnish
  {
    name: 'Mikko',
    engine: 4,
    language: 23,
    voice: 1
  },
  {
    name: 'Milla',
    engine: 2,
    language: 23,
    voice: 1
  },
  {
    name: 'Marko',
    engine: 2,
    language: 23,
    voice: 2
  },

  // English
  {
    name: 'Alan (AUS)',
    engine: 2,
    language: 1,
    voice: 9
  },
  {
    name: 'Paul (US)',
    engine: 3,
    language: 1,
    voice: 2
  },
  {
    name: 'Daniel (UK)',
    engine: 4,
    language: 1,
    voice: 5
  },

  // Swedish
  {
    name: 'Sven',
    engine: 2,
    language: 9,
    voice: 2
  }
].forEach(registerVoice);

const generateHashCode = (text, voiceConfig) => {
  const { engine, language, voice } = voiceConfig;
  const fragments = [
    `<engineID>${engine}</engineID>`,
    `<voiceID>${voice}</voiceID>`,
    `<langID>${language}</langID>`,
    '<ext>mp3</ext>',
    text
  ];

  return md5(fragments.join(''));
};

const generateUrl = (hash, text, voice) => buildUrl(
  'http://cache-a.oddcast.com',
  {
    path: `c_fs/${hash}.mp3`,
    queryParams: {
      engine: voice.engine,
      language: voice.language,
      voice: voice.voice,
      text,
      useUTF8: 1
    }
  }
);

module.exports.retrieve = (text, voice) => new Promise((resolve, reject) => {
  const hash = generateHashCode(text, voice);
  const file = path.join(__dirname, '..', 'cache', `${hash}.mp3`);

  if (fs.existsSync(file)) {
    resolve(hash);
    return;
  }

  request(generateUrl(hash, text, voice))
    .on('error', reject)
    .pipe(fs.createWriteStream(file))
    .on('close', () => resolve(hash));
});
