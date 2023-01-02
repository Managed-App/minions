const {execSync} = require("child_process");

function listImages() {
    const resp = execSync("cd " + process.env.MANAGED_HOME + " && bin/skipper images", {
        env: {
            ...process.env,
            PATH: process.env.RUBY_PATH + ":$PATH",
            GEM_PATH: process.env.GEM_PATH,
            GEM_HOME: process.env.GEM_HOME,
        }
    });
    return wrapCode(stripAnsi(resp.toString("utf8")));
}

function stripAnsi(raw) {
    return raw.replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function wrapCode(raw) {
    return "```" + raw + "```";
}

module.exports = {listImages};
