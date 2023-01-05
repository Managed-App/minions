const {execSync} = require("child_process");
const {stripAnsi} = require("./util");
const {Octokit} = require("octokit");

function listImages(log) {
    var resp = execSync("cd " + process.env.MANAGED_HOME + " && bin/skipper images", {
        env: {
            ...process.env,
            PATH: process.env.RUBY_PATH + ":$PATH",
            GEM_PATH: process.env.GEM_PATH,
            GEM_HOME: process.env.GEM_HOME,
        }
    });
    resp = stripAnsi(resp.toString("utf8")).split("\n").sort(
        (a, b) => {
            if (a.split(" ")[1] > b.split(" ")[1]) {
                return -11;
            } else {
                return 1;
            }
        }
    );
    log.info(`${resp.length} images found`);
    return resp;
}

async function createGithubArtefacts(app, version, log) {
    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    })
    var owner = process.env.GITHUB_ORG;
    var repo = process.env.GITHUB_REPONAME;

    var result = false;

    try {
        var resp = await octokit.request(`POST /repos/${owner}/${repo}/releases`, {
            owner: owner,
            repo: repo,
            tag_name: version,
            target_commitish: 'master',
            name: version,
            body: `Release ${version}`,
            draft: false,
            prerelease: false,
            generate_release_notes: true,
        });

        result = (resp.status && resp.status == 201);
        if (result) {
            log.info(`release ${version} created on Github`);
        } else {
            log.error(`failed to release ${version} on Github, cause: ${resp}`);
        }
    } catch (err) {
        if (err && err.status === 422) {
            log.error(`failed to release ${version} on Github, it already exists`);
        } else {
            log.error(`failed to release ${version} on Github, cause: ${err}`);
        }
    }
    return result;
}

async function showEnv(target, log) {  //needed for ruby2.6.4
    const resp = execSync(`cd ${process.env.MANAGED_HOME} && ${process.env.DEIS_HOME}/deis releases:list -a managed-${target}`, {
        env: {
            ...process.env,
            PATH: process.env.RUBY_PATH + ":$PATH",
            GEM_PATH: process.env.GEM_PATH,
            GEM_HOME: process.env.GEM_HOME,
        }
    });
    var depls = stripAnsi(resp.toString("utf8")).split("\n");
    depls = depls.filter((line) => line.includes("deployed"));
    const version = depls[0].slice(depls[0].lastIndexOf(":") + 1);
    log.info(`env ${target} running version ${version}`);
    return version;
}

module.exports = {listImages, showEnv, createGithubArtefacts};
