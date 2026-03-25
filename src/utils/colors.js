// ANSI color helpers — no external dependency, works in any terminal
const c = {
    reset:  s => `\x1b[0m${s}\x1b[0m`,
    bold:   s => `\x1b[1m${s}\x1b[0m`,
    dim:    s => `\x1b[2m${s}\x1b[0m`,
    green:  s => `\x1b[32m${s}\x1b[0m`,
    yellow: s => `\x1b[33m${s}\x1b[0m`,
    cyan:   s => `\x1b[36m${s}\x1b[0m`,
    gray:   s => `\x1b[90m${s}\x1b[0m`,
    red:    s => `\x1b[31m${s}\x1b[0m`,
    white:  s => `\x1b[97m${s}\x1b[0m`,
};

const NO_COLOR = process.env.NO_COLOR || !process.stdout.isTTY;

module.exports = NO_COLOR
    ? Object.fromEntries(Object.keys(c).map(k => [k, s => s]))
    : c;
