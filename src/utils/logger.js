const chalk = require('chalk').default;
const i18n = require('./helpers/i18n');

i18n.locale('en');

const log = {
    info: (message, ...args) => console.log(chalk.blue('[INFO]'), message, ...args),
    warn: (message, ...args) => console.warn(chalk.yellow('[WARN]'), message, ...args),
    error: (message, ...args) => console.error(chalk.red('[ERROR]'), message, ...args),
    success: (message, ...args) => console.log(chalk.green('[SUCCESS]'), message, ...args),
    debug: (message, ...args) => console.log(chalk.gray('[DEBUG]'), message, ...args)
};

module.exports = log;
