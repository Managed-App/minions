const { exec } = require('child_process')
const util = require('util')

const { prisma } = require('./prisma')
const { DEPLOYMENT_STATUS } = require('./constants')
const { wait, promiseWrapper } = require('./util')
const {
  checkVersionFromReleasesForAPeriod,
  runDeisReleasesList,
  getSlackTeamInfo,
} = require('./helpers')
const { DeploymentIncompleteError, CommandError } = require('./errors')

const { blockify, blockifyForChannel } = require('./minions')
const { Help } = require('./help')
const { runSkipperListImages } = require('./images')

const uatAdminLink = 'https://managed-uat.man.redant.com.au/admin'
const prodAdminLink = 'https://go.managedapp.com.au/admin'

const execPromise = util.promisify(exec)

async function Env(client, command, ack, respond, log) {
  const cs = command.text.split(' ')
  const [_env, target, ...other] = cs

  await ack()
  // env name
  if (cs.length == 2) {
    if (target && (target === 'uat' || target === 'prod')) {
      const result = await runDeisReleasesList(target, log)

      const deploymentAudit = await prisma.deploymentAudit.findFirst({
        where: {
          environment: target,
          version: result,
          status: DEPLOYMENT_STATUS.SUCCESS,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      let auditMessage = ''

      if (deploymentAudit) {
        const deploymentDate = new Date(deploymentAudit.createdAt).toString()
        auditMessage = `deployed by \`${deploymentAudit.slackUser}\` on ${deploymentDate}`
      }

      await respond(
        blockifyForChannel(
          `Managed env \`${target}\` (${
            target == 'uat' ? uatAdminLink : prodAdminLink
          }) running version \`${result}\` ${auditMessage}`
        )
      )

      log.info(
        `'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`
      )

      return result
    } else {
      log.warn(
        `'/minions ${command.text}' command failed for ${command.user_name} in channel ${command.channel_name}`
      )
      await respond(
        blockifyForChannel(
          `'/minions ${command.text}' invalid, try 'uat' | 'prod' for env`
        )
      )
    }
    //  env name deploy v001
  } else if (cs.length == 4) {
    const [action, version] = other

    if (action !== 'deploy') {
      await Help(command, ack, respond, log)
      return
    }

    // Catch Current Deployer AboutAttempted Deployment
    if (global.isEnvironmentBusy(target)) {
      messageCurrentDeployerAboutAttemptedDeployment(
        client,
        target,
        command.user_name
      )
      return await respond(
        blockifyForChannel(
          `Env \`${target}\` deployment triggered by \`${global.deploymentState[target]['actor']['userName']}\` is in progress, please try again later.`
        )
      )
    }

    global.setCurrentDeployment(target, command.user_id, command.user_name)

    // run skipper deploy
    const [skipperDeploy, skipperDeployError] = await promiseWrapper(
      runSkipperDeploy(target, version, respond, log)
    )

    // handle runSkipperDeploy error
    if (skipperDeployError) {
      // skipper timeouts
      if (
        skipperDeployError.message.includes('Net::ReadTimeout') ||
        skipperDeployError.message.includes('Command failed') ||
        skipperDeployError.message.includes('An unexpected error occurred')
      ) {
        await respond(
          blockifyForChannel(
            `Confirming version \`${version}\` deployment in \`${target}\` env. Please wait.`
          )
        )
        // retry
        return checkVersionFromReleasesForAPeriod(
          version,
          target,
          600000,
          log
        ).then(async ({ isReleased }) => {
          await createDeploymentLog(
            client,
            {
              ...command,
              target,
              version,
              status: isReleased
                ? DEPLOYMENT_STATUS.SUCCESS
                : DEPLOYMENT_STATUS.FAILED,
            },
            log
          )

          return await respond(
            blockifyForChannel(
              `Deployment ${
                isReleased ? 'complete' : 'failed'
              } for \`${target}\` env , version \`${version}\`.`
            )
          )
        })
      }

      let statusDescription = null

      if (skipperDeployError instanceof DeploymentIncompleteError) {
        statusDescription = 'Deployment Incomplete Error'
        await respond(blockifyForChannel(skipperDeployError.message))
      } else if (skipperDeployError instanceof CommandError) {
        statusDescription = 'Command Error'
        await respond(blockifyForChannel(skipperDeployError.message))
      } else {
        statusDescription = 'Unexpected Error'
        await respond(blockifyForChannel('An unexpected error occurred.'))
        log.error(skipperDeployError)
      }

      await createDeploymentLog(
        client,
        {
          ...command,
          target,
          version,
          status: DEPLOYMENT_STATUS.FAILED,
          statusDescription,
        },
        log
      )

      return
    }

    // run skipper success
    await createDeploymentLog(
      client,
      {
        ...command,
        target,
        version,
        status: DEPLOYMENT_STATUS.SUCCESS,
      },
      log
    )

    log.info(
      `'/minions ${command.text}' command executed for ${command.user_name} in channel ${command.channel_name}`
    )
  } else {
    await Help(command, ack, respond, log)
  }
}

const messageCurrentDeployerAboutAttemptedDeployment = async (
  client,
  envName,
  attemptedDeployerName
) => {
  return client.chat.postMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: global.deploymentState[envName]['actor']['id'],
    blocks: blockify(
      `blocked ${attemptedDeployerName} from deploying to ${envName} while job is in progress.`
    ),
  })
}

const runSkipperDeploy = (target, version, respond, log) => {
  return new Promise(async (resolve, reject) => {
    const command = `${process.env.RUBY_HOME}/ruby bin/skipper deploy managed:${version} --group managed-${target}`

    const [skipperDeploy, skipperDeployError] = await promiseWrapper(
      execPromise(command, {
        env: {
          ...process.env,
          PATH: process.env.RUBY_PATH + ':' + process.env.PATH,
          RUBY_PATH: process.env.RUBY_PATH,
          GEM_PATH: process.env.GEM_PATH,
          GEM_HOME: process.env.GEM_HOME,
          RUBY_VERSION: 'ruby-2.6.4',
        },
        cwd: `${process.env.MANAGED_HOME}`,
      })
    )

    if (version.charAt(0) !== 'v') {
      return reject(
        new CommandError(
          `Incorrect version format \`${version}\`. Do you mean version \`v${version}?\``
        )
      )
    }

    await respond(
      blockifyForChannel(
        `Beginning deployment for \`${target}\` env, version \`${version}\`. ETA ~7m.`
      )
    )
    // test reject
    // return reject(new Error('Net::ReadTimeout'))
    // return reject(new Error('Command failed'))
    // return reject(new Error('An unexpected error occurred'))

    if (skipperDeployError) {
      reject(skipperDeployError)
    }

    log.debug(`os executed ${command} stdout: ${skipperDeploy.stdout}`)

    let isSuccess = false

    for (let i = 0; i < 100; i++) {
      const deployedVersion = await runDeisReleasesList(target, log)
      if (deployedVersion === version) {
        isSuccess = true
        break
      }

      await wait(3000)
    }

    log.info(
      `Deployment for ${target}, version ${version} is ${
        isSuccess ? 'complete' : 'incomplete'
      }`
    )

    if (isSuccess) {
      await respond(
        blockifyForChannel(
          `Deployment complete for \`${target}\` env , version \`${version}\`.`
        )
      )
      return resolve(isSuccess)
    } else {
      return reject(
        new DeploymentIncompleteError(
          `Uh oh, deployment incomplete for \`${target}\` env , version \`${version}\`. Check results with \`/minions env ${target}\``
        )
      )
    }
  })
}

const createDeploymentLog = async (client, params, log) => {
  const {
    team_domain,
    channel_name,
    user_name,
    target,
    version,
    status,
    statusDescription,
  } = params

  const slackInstance = await getSlackTeamInfo(client, team_domain)
  const data = {
    environment: target,
    version,
    status,
    statusDescription: statusDescription || null,
    slackChannel: channel_name,
    slackUser: user_name,
    slackInstance,
  }

  if (status === DEPLOYMENT_STATUS.SUCCESS) {
    const images = await runSkipperListImages(log)
    const image = images
      .map((imgString) => ({
        hash: imgString.split(' ')[0],
        version: imgString.split(' ')[1],
      }))
      .find((obj) => obj.version === version)

    data.hash = image.hash
  }

  global.unsetCurrentDeployment(target)

  await prisma.deploymentAudit.create({
    data,
  })
}

module.exports = { Env }
