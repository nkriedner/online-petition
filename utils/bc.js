// Module for password security (three useful functions for this project):
const { genSalt, hash, compare } = require("bcryptjs");

exports.hash = (password) => genSalt().then((salt) => hash(password, salt));

// Export the methods we will need:
exports.compare = compare;
