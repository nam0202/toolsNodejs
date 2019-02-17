const RestCore = require('rest-core');
const server = new RestCore(__dirname);
server.start('access.log');