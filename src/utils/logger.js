const c = require("./colors");

const DIVIDER = "─".repeat(40);

function divider() { console.log(c.gray(DIVIDER)); }

function error(msg) {
    process.stderr.write(c.red(`✖ ${msg}`) + "\n");
}

function warn(msg) {
    process.stderr.write(c.yellow(`⚠ ${msg}`) + "\n");
}

function success(msg) {
    console.log(c.green(`✔ ${msg}`));
}

// Progress shown on stderr so it doesn't pollute piped stdout
let _progressActive = false;

function progressStart(msg) {
    if (!process.stderr.isTTY) return;
    _progressActive = true;
    process.stderr.write(c.gray(msg));
}

function progressDone() {
    if (!_progressActive) return;
    process.stderr.write("\r\x1b[K"); // clear line
    _progressActive = false;
}

module.exports = { divider, error, warn, success, progressStart, progressDone };
