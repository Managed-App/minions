const {execSync} = require("child_process");
const {stripAnsi} = require("./util");
const {Octokit} = require("octokit");

function listImages() {
    const resp = execSync("cd " + process.env.MANAGED_HOME + " && bin/skipper images", {
        env: {
            ...process.env,
            PATH: process.env.RUBY_PATH + ":$PATH",
            GEM_PATH: process.env.GEM_PATH,
            GEM_HOME: process.env.GEM_HOME,
        }
    });
    return stripAnsi(resp.toString("utf8"));
}

async function createGithubArtefacts(tag) {
    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    })
    var owner = process.env.GITHUB_ORG;
    var repo = process.env.GITHUB_REPONAME;

    var resp = await octokit.request(`POST /repos/${owner}/${repo}/releases`, {
        owner: owner,
        repo: repo,
        tag_name: tag,
        target_commitish: 'master',
        name: tag,
        body: `Release ${tag}`,
        draft: false,
        prerelease: false,
        generate_release_notes: true,
    });

    console.log(resp)
}

module.exports = {listImages, createGithubArtefacts};
