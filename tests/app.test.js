const { when } = require('jest-when')
const axios = require('axios')
const child_process = require('child_process')
const util = require('util')
const { createMinionsApp } = require('../app')
const { slashCommand } = require('@slack-wrench/fixtures')
const FakeTimers = require("@sinonjs/fake-timers")
const JestReceiver = require('@slack-wrench/jest-bolt-receiver').default

jest.mock('axios')
jest.mock('child_process')
const clock = FakeTimers.install()

axios.create.mockReturnValue(axios) // mock axios to intercept calls to Slack
// mocks for skipper and deis commands
when(child_process.exec).calledWith(expect.stringContaining('bin/deis releases:list'), expect.anything(), expect.anything()).mockImplementation((_command, _vars, callback) =>
    callback(null, {
        stdout: `
            === managed-uat Releases (6 of 498)
            v498    2023-01-17T07:02:50Z    USER deployed fake-ecr.aws.com/managed:v650
            v497    2023-01-17T01:55:19Z    USER deployed fake-ecr.aws.com/managed:v649
            v496    2023-01-16T04:53:29Z    USER deployed fake-ecr.aws.com/managed:v647
            v495    2023-01-16T04:28:01Z    USER deployed fake-ecr.aws.com/managed:v647
            v494    2023-01-16T04:00:57Z    USER deployed fake-ecr.aws.com/managed:v646
            v493    2023-01-16T03:58:54Z    USER deployed fake-ecr.aws.com/managed:v646
        `
    })
)
when(child_process.exec).calledWith(expect.stringContaining('bin/skipper images'), expect.anything(), expect.anything()).mockImplementation((_command, _vars, callback) =>
    callback(null, {
        stdout: [
            'b60f5badcbbe6 v650',
            'f709b4ae79bba v649',
            '428baf2648f22 v648',
            '96ec985a9e8c4 v647',
            '074e0d002b6f7 v646',
            '0b3c113168003 v645',
            '46d70dc94185e v644',
            '7f8f5570a2385 v643',
            '9f3e08012a40e v642'
        ]
    })
)
when(child_process.exec).calledWith(expect.stringContaining('bin/skipper deploy'), expect.anything(), expect.anything()).mockImplementation((_command, _vars, callback) =>
    callback(null, {
        stdout: `* deploying managed:v650 to managed-pdf-uat * checking managed-pdf-uat pods * deploying managed:v650 to managed-uat * checking managed-uat pods`
    })
)

afterEach(() => {
    jest.clearAllMocks()
})

describe('integration tests', () => {
    const receiver = new JestReceiver()
    createMinionsApp(receiver)

    test('should respond with help commands for invalid commad', async () => {
        await receiver.send(slashCommand('/minions', { text: 'invalid command input' }))

        const helpMenuText = [
            "/minions env uat               show deployed version on uat.",
            "/minions env prod              show deployed version on prod.",
            "/minions env uat deploy vnnn   deploy verson vnnn to uat.",
            "/minions env prod deploy vnnn  deploy verson vnnn to prod.",
            "/minions tag vnnn              create image with tag vnnn on ECR.",
            "/minions images                list recent images on ECR.",
            "/minions images vnnn           filter for a specific image on ECR",
            "/minions images latest         show the latest image on ECR",
            "/minions hello                 bananas!",
            "/minions help                  show this message."
        ].join('\n')

        expect(axios.post).toHaveBeenLastCalledWith(
            expect.any(String),
            {
                blocks: [
                    {
                        text: {
                            text: expect.any(String), // Random Sentence
                            type: "mrkdwn"
                        },
                        type: "section"
                    },
                    {
                        text: {
                            text: `\`\`\`${helpMenuText}\`\`\``,
                            type: "mrkdwn"
                        },
                        type: "section"
                    },
                    {
                        type: "divider"
                    }
                ],
                response_type: "in_channel"
            }
        )
    })

    test('should be able to run commands one after another', async () => {
        receiver.send(slashCommand('/minions', { text: 'env uat deploy v650' }))
        await receiver.send(slashCommand('/minions', { text: 'images' }))

        expect(axios.post).toHaveBeenNthCalledWith(
            4, // 1st is the command echo for deploy, 2nd is the deploy command starting, 3rd is the echo for the images command
            expect.any(String),
            {
                blocks: expect.arrayContaining([
                    {
                        text: {
                            "type": "mrkdwn",
                            "text": "These are the most recent `1` images matching your filter"
                        },
                        type: "section"
                    }
                ]),
                response_type: "in_channel"
            }
        )

        // The success response from deploy command should still send
        expect(axios.post).toHaveBeenLastCalledWith(
            expect.any(String),
            {
                blocks: expect.arrayContaining([
                    {
                        text: {
                            text: "Deployment complete for `uat` env , version `v650`.",
                            type: "mrkdwn"
                        },
                        type: "section"
                    },
                ]),
                response_type: "in_channel"
            }
        )
    })

    describe('should always respond to channel with the inputted command', () => {
        test('/minions hello', async () => {
            await receiver.send(slashCommand('/minions', { text: 'hello' }))
    
            expect(axios.post).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                {
                    blocks: [
                        {
                            text: {
                                text: expect.any(String), // Random Sentence
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            text: {
                                text: "`/minions hello` [USER]",
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            type: "divider"
                        }
                    ],
                    response_type: "in_channel"
                }
            )
        })

        test('/minions help', async () => {
            await receiver.send(slashCommand('/minions', { text: 'help' }))
    
            expect(axios.post).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                {
                    blocks: [
                        {
                            text: {
                                text: expect.any(String), // Random Sentence
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            text: {
                                text: "`/minions help` [USER]",
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            type: "divider"
                        }
                    ],
                    response_type: "in_channel"
                }
            )
        })

        test('/minions env', async () => {
            await receiver.send(slashCommand('/minions', { text: 'env uat' }))
    
            expect(axios.post).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                {
                    blocks: [
                        {
                            text: {
                                text: expect.any(String), // Random Sentence
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            text: {
                                text: "`/minions env uat` [USER]",
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            type: "divider"
                        }
                    ],
                    response_type: "in_channel"
                }
            )
        })

        test('/minions env ENV deploy vNNN', async () => {
            await receiver.send(slashCommand('/minions', { text: 'env uat deploy v650' }))
    
            expect(axios.post).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                {
                    blocks: [
                        {
                            text: {
                                text: expect.any(String), // Random Sentence
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            text: {
                                text: "`/minions env uat deploy v650` [USER]",
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            type: "divider"
                        }
                    ],
                    response_type: "in_channel"
                }
            )
        })

        test('/minions images', async () => {
            await receiver.send(slashCommand('/minions', { text: 'images' }))
    
            expect(axios.post).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                {
                    blocks: [
                        {
                            text: {
                                text: expect.any(String), // Random Sentence
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            text: {
                                text: "`/minions images` [USER]",
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            type: "divider"
                        }
                    ],
                    response_type: "in_channel"
                }
            )
        })

        test('/minions images vNNN', async () => {
            await receiver.send(slashCommand('/minions', { text: 'images v650' }))
    
            expect(axios.post).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                {
                    blocks: [
                        {
                            text: {
                                text: expect.any(String), // Random Sentence
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            text: {
                                text: "`/minions images v650` [USER]",
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            type: "divider"
                        }
                    ],
                    response_type: "in_channel"
                }
            )
        })

        test('/minions images latest', async () => {
            await receiver.send(slashCommand('/minions', { text: 'images latest' }))
    
            expect(axios.post).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                {
                    blocks: [
                        {
                            text: {
                                text: expect.any(String), // Random Sentence
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            text: {
                                text: "`/minions images latest` [USER]",
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            type: "divider"
                        }
                    ],
                    response_type: "in_channel"
                }
            )
        })
    })

    describe('/minions hello', () => {
        test('should respond with correct blockified message', async () => {
            await receiver.send(slashCommand('/minions', { text: 'hello' }))

            expect(axios.post).toHaveBeenLastCalledWith(
                expect.any(String),
                {
                    blocks: [
                        {
                            text: {
                                text: expect.any(String),
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            type: "image",
                            title: {
                                type: "plain_text",
                                text: "Bob"
                            },
                            block_id: "bob",
                            image_url: "https://i0.wp.com/princetonbuffer.princeton.edu/wp-content/uploads/sites/185/2015/10/minions_2015-wide.jpg?resize=672%2C372&ssl=1",
                            alt_text: "Bob"
                        },
                        {
                            type: "divider"
                        }
                    ],
                    response_type: "in_channel"
                }
            )
        })
    })

    describe('/minions env', () => {
        describe('/minions env ENV', () => {
            test('should respond with correct blockified message', async () => {
                await receiver.send(slashCommand('/minions', { text: 'env uat' }))
    
                expect(axios.post).toHaveBeenLastCalledWith(
                    expect.any(String),
                    {
                        blocks: [
                            {
                                text: {
                                    text: expect.any(String),
                                    type: "mrkdwn"
                                },
                                type: "section"
                            },
                            {
                                text: {
                                    text: "Managed env `uat` (https://managed-uat.man.redant.com.au/admin) running version `v650`",
                                    type: "mrkdwn"
                                },
                                type: "section"
                            },
                            {
                                type: "divider"
                            }
                        ],
                        response_type: "in_channel"
                    }
                )
            })
        })

        describe('/minions env ENV deploy vNNN', () => {
            test('should respond with correct blockified message when deployment starts', async () => {
                await receiver.send(slashCommand('/minions', { text: 'env uat deploy v650' }))

                expect(axios.post).toHaveBeenNthCalledWith(
                    2,
                    expect.any(String),
                    {
                        blocks: [
                            {
                                text: {
                                    text: expect.any(String),
                                    type: "mrkdwn"
                                },
                                type: "section"
                            },
                            {
                                text: {
                                    text: "Beginning deployment for `uat` env, version `v650`. ETA ~7m.",
                                    type: "mrkdwn"
                                },
                                type: "section"
                            },
                            {
                                type: "divider"
                            }
                        ],
                        response_type: "in_channel"
                    }
                )
            })

            test('should respond with correct blockified message when deployment completes', async () => {
                await receiver.send(slashCommand('/minions', { text: 'env uat deploy v650' }))

                expect(axios.post).toHaveBeenLastCalledWith(
                    expect.any(String),
                    {
                        blocks: [
                            {
                                text: {
                                    text: expect.any(String),
                                    type: "mrkdwn"
                                },
                                type: "section"
                            },
                            {
                                text: {
                                    text: "Deployment complete for `uat` env , version `v650`.",
                                    type: "mrkdwn"
                                },
                                type: "section"
                            },
                            {
                                type: "divider"
                            }
                        ],
                        response_type: "in_channel"
                    }
                )
            })

            test('should block deployment to same environment when another deployment is in progress', async () => {
                receiver.send(slashCommand('/minions', { text: 'env uat deploy v650' }))
                await receiver.send(slashCommand('/minions', { text: 'env uat deploy v650' }))

                expect(axios.post).toHaveBeenNthCalledWith(
                    4, // 1st and 2nd are command echoes to channel, 3rd is the first deployment starting
                    expect.any(String),
                    {
                        blocks: [
                            {
                                text: {
                                    text: expect.any(String),
                                    type: "mrkdwn"
                                },
                                type: "section"
                            },
                            {
                                text: {
                                    text: "Env `uat` deployment triggered by `USER` is in progress, please try again later.",
                                    type: "mrkdwn"
                                },
                                type: "section"
                            },
                            {
                                type: "divider"
                            }
                        ],
                        response_type: "in_channel"
                    }
                )

                // the first deployment should still complete
                expect(axios.post).toHaveBeenLastCalledWith(
                    expect.any(String),
                    {
                        blocks: [
                            {
                                text: {
                                    text: expect.any(String),
                                    type: "mrkdwn"
                                },
                                type: "section"
                            },
                            {
                                text: {
                                    text: "Deployment complete for `uat` env , version `v650`.",
                                    type: "mrkdwn"
                                },
                                type: "section"
                            },
                            {
                                type: "divider"
                            }
                        ],
                        response_type: "in_channel"
                    }
                )
            })

            describe('when Skipper returns a Timeout error', () => {
                test('should confirm if the deployment still went through and respond with correct blockified message when the deployment succeeded', async () => {
                    when(child_process.exec).calledWith(expect.stringContaining('bin/skipper deploy'), expect.anything(), expect.anything()).mockImplementation((_command, _vars, callback) => 
                        callback(
                            new Error('Error: Command failed: ruby bin/skipper deploy managed:v650 --group managed-prod'),
                            null,
                            { stderr: 'Error: Command failed: ruby bin/skipper deploy managed:v650 --group managed-prod' }
                        )
                    )
                    // mock first 2 calls to releases to not include the expected version (v650)
                    when(child_process.exec).calledWith(expect.stringContaining('bin/deis releases:list'), expect.anything(), expect.anything())
                        .mockImplementationOnce((_command, _vars, callback) =>
                            callback(null, {
                                stdout: `
                                    === managed-uat Releases (6 of 498)
                                    v497    2023-01-17T01:55:19Z    USER deployed fake-ecr.aws.com/managed:v649
                                    v496    2023-01-16T04:53:29Z    USER deployed fake-ecr.aws.com/managed:v647
                                    v495    2023-01-16T04:28:01Z    USER deployed fake-ecr.aws.com/managed:v647
                                    v494    2023-01-16T04:00:57Z    USER deployed fake-ecr.aws.com/managed:v646
                                    v493    2023-01-16T03:58:54Z    USER deployed fake-ecr.aws.com/managed:v646
                                `
                            })
                        )
                        .mockImplementationOnce((_command, _vars, callback) =>
                            callback(null, {
                                stdout: `
                                    === managed-uat Releases (6 of 498)
                                    v497    2023-01-17T01:55:19Z    USER deployed fake-ecr.aws.com/managed:v649
                                    v496    2023-01-16T04:53:29Z    USER deployed fake-ecr.aws.com/managed:v647
                                    v495    2023-01-16T04:28:01Z    USER deployed fake-ecr.aws.com/managed:v647
                                    v494    2023-01-16T04:00:57Z    USER deployed fake-ecr.aws.com/managed:v646
                                    v493    2023-01-16T03:58:54Z    USER deployed fake-ecr.aws.com/managed:v646
                                `
                            })
                        )
                    const promisifySpy = jest.spyOn(util, 'promisify')

                    receiver.send(slashCommand('/minions', { text: 'env uat deploy v650' }))
                    await clock.runAllAsync()

                    expect(promisifySpy).toThrowError()

                    // should respond that we're checking if the deployment went through
                    expect(axios.post).toHaveBeenNthCalledWith(
                        3,
                        expect.any(String),
                        {
                            blocks: [
                                {
                                    text: {
                                        text: expect.any(String),
                                        type: "mrkdwn"
                                    },
                                    type: "section"
                                },
                                {
                                    text: {
                                        text: "Confirming version `v650` deployment in `uat` env. Please wait.",
                                        type: "mrkdwn"
                                    },
                                    type: "section"
                                },
                                {
                                    type: "divider"
                                }
                            ],
                            response_type: "in_channel"
                        }
                    )

                    // should send out success message after confirming in releases
                    expect(axios.post).toHaveBeenLastCalledWith(
                        expect.any(String),
                        {
                            blocks: [
                                {
                                    text: {
                                        text: expect.any(String),
                                        type: "mrkdwn"
                                    },
                                    type: "section"
                                },
                                {
                                    text: {
                                        text: "Deployment complete for `uat` env , version `v650`.",
                                        type: "mrkdwn"
                                    },
                                    type: "section"
                                },
                                {
                                    type: "divider"
                                }
                            ],
                            response_type: "in_channel"
                        }
                    )
                })

                test('should confirm if the deployment still went through and respond with correct blockified message when the deployment failed', async () => {
                    when(child_process.exec).calledWith(expect.stringContaining('bin/skipper deploy'), expect.anything(), expect.anything()).mockImplementation((_command, _vars, callback) => 
                        callback(
                            new Error('Error: Command failed: ruby bin/skipper deploy managed:v650 --group managed-prod'),
                            null,
                            { stderr: 'Error: Command failed: ruby bin/skipper deploy managed:v650 --group managed-prod' }
                        )
                    )
                    // mock releases to never include the expected version
                    when(child_process.exec).calledWith(expect.stringContaining('bin/deis releases:list'), expect.anything(), expect.anything()).mockImplementation((_command, _vars, callback) =>
                        callback(null, {
                            stdout: `
                                === managed-uat Releases (6 of 498)
                                v497    2023-01-17T01:55:19Z    USER deployed fake-ecr.aws.com/managed:v649
                                v496    2023-01-16T04:53:29Z    USER deployed fake-ecr.aws.com/managed:v647
                                v495    2023-01-16T04:28:01Z    USER deployed fake-ecr.aws.com/managed:v647
                                v494    2023-01-16T04:00:57Z    USER deployed fake-ecr.aws.com/managed:v646
                                v493    2023-01-16T03:58:54Z    USER deployed fake-ecr.aws.com/managed:v646
                            `
                        })
                    )
                    const promisifySpy = jest.spyOn(util, 'promisify')

                    receiver.send(slashCommand('/minions', { text: 'env uat deploy v650' }))
                    await clock.runAllAsync()

                    expect(promisifySpy).toThrowError()

                    // should respond that we're checking if the deployment went through
                    expect(axios.post).toHaveBeenNthCalledWith(
                        3,
                        expect.any(String),
                        {
                            blocks: [
                                {
                                    text: {
                                        text: expect.any(String),
                                        type: "mrkdwn"
                                    },
                                    type: "section"
                                },
                                {
                                    text: {
                                        text: "Confirming version `v650` deployment in `uat` env. Please wait.",
                                        type: "mrkdwn"
                                    },
                                    type: "section"
                                },
                                {
                                    type: "divider"
                                }
                            ],
                            response_type: "in_channel"
                        }
                    )

                    // should send out failure message after checking in releases
                    expect(axios.post).toHaveBeenLastCalledWith(
                        expect.any(String),
                        {
                            blocks: [
                                {
                                    text: {
                                        text: expect.any(String),
                                        type: "mrkdwn"
                                    },
                                    type: "section"
                                },
                                {
                                    text: {
                                        text: "Deployment failed for `uat` env , version `v650`.",
                                        type: "mrkdwn"
                                    },
                                    type: "section"
                                },
                                {
                                    type: "divider"
                                }
                            ],
                            response_type: "in_channel"
                        }
                    )
                })
            })
        })
    })

    describe('/minions images', () => {
        test('should respond with correct blockified message', async () => {
            await receiver.send(slashCommand('/minions', { text: 'images' }))

            expect(axios.post).toHaveBeenLastCalledWith(
                expect.any(String),
                {
                    blocks: [
                        {
                            text: {
                                text: expect.any(String),
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            text: {
                                "type": "mrkdwn",
                                "text": "These are the most recent `1` images matching your filter"
                            },
                            type: "section"
                        },
                        {
                            text: {
                                text: "`v650,f709b4ae79bba`, hash `b60f5badcbbe6`",
                                type: "mrkdwn"
                            },
                            type: "section"
                        },
                        {
                            type: "divider"
                        }
                    ],
                    response_type: "in_channel"
                }
            )
        })
    })
})