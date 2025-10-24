const bcrypt = require('bcryptjs');

const password = '000000'; // Change this to your desired password
const saltRounds = 10;

const hash = bcrypt.hashSync(password, saltRounds);
console.log('Hashed password:', hash);
