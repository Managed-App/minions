const { execSync } = require("child_process");

function listImages() {
    const resp = execSync("cd " + process.env.MANAGED_HOME+" && bin/skipper images", {
        env: {
            ...process.env,
            PATH: process.env.RUBY_PATH+":$PATH",
            GEM_PATH: process.env.GEM_PATH,
            GEM_HOME: process.env.GEM_HOME,
        }
    });
    return resp.toString("utf8");
}

module.exports = { listImages } ;
