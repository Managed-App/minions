const {Octokit} = require("octokit");
const {Help} = require("./help");

async function Tag(command, ack, respond, log) {
    const ls = `'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`;
    const lf = `'/minions ${command.text}' command failed for ${command.user_name} in channel ${command.channel_name}`;

    const version = command.text.split(" ")[1];
    if (version && version.length > 0) {
        const rCode = await createGithubArtefacts(version, log);
        await ack();

        switch (rCode) {
            case 201:
                await respond(
                    {
                        blocks: [
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": `Release \`${version}\` created on Github, image build now in progress ETA ~11m`
                                },
                            },
                        ]
                    }
                );
                log.info(ls);
                break;
            case 422:
                await respond(
                    {
                        blocks: [
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": `Release \`${version}\` already exists on Github, no action required.`
                                },
                            },
                        ]
                    }
                );
                log.info(lf);
                break;
            case 500:
            default:
                await respond(
                    {
                        blocks: [
                            {
                                "type": "section",
                                "text": {
                                    "type": "mrkdwn",
                                    "text": `Error creating release \`${version}\` on Github, check results manually before deploying.`
                                },
                            },
                        ]
                    }
                );
                log.warn(lf);
                break;
        }

    } else {
        await Help(command, ack, respond, log);
    }
}

async function createGithubArtefacts(version, log) {
    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
    })
    var owner = process.env.GITHUB_ORG;
    var repo = process.env.GITHUB_REPONAME;

    var result;

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

        result = resp.status;
        if (result) {
            log.info(`release ${version} created on Github`);
        } else {
            log.error(`failed to release ${version} on Github, cause: ${resp}`);
        }
    } catch (err) {
        if (err && err.status === 422) {
            result = err.status;
            log.error(`failed to release ${version} on Github, it already exists`);
        } else {
            result = 500;
            log.error(`failed to release ${version} on Github, cause: ${err}`);
        }
    }
    return result;
}

module.exports = {Tag};
