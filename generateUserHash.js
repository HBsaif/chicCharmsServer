const bcrypt = require('bcryptjs');
bcrypt.hash('userpassword', 10).then(hash => console.log(hash));