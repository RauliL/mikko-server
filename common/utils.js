module.exports.isBlank = RegExp.prototype.test.bind(/^\s*$/);

module.exports.isValidNick = RegExp.prototype.test.bind(
  /^[a-zA-Z0-9_-]{1,15}$/
);

module.exports.ignoreCaseCompare = (a, b) => {
  const lowerCaseA = a.toLowerCase();
  const lowerCaseB = b.toLowerCase();

  return lowerCaseA > lowerCaseB ? 1 : lowerCaseA < lowerCaseB ? -1 : 0;
};
