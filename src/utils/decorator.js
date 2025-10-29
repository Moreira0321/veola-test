const log = require('./logger')

export const withTime = (fn) => (...args) => {
    const time = new Date().toISOString();
    log.info(`[${time}]`);
    return fn(...args);
};
