const { createMinionsApp } = require('../app')
const axios = require('axios')
const { slashCommand } = require('@slack-wrench/fixtures')
const JestReceiver = require('@slack-wrench/jest-bolt-receiver').default

jest.mock('axios')

describe('integration tests', () => {
    axios.create.mockReturnValue(axios)
    const receiver = new JestReceiver()
    createMinionsApp(receiver)

    describe('should always respond to channel with the inputted command', () => {
        test('/minions hello', async () => {
            await receiver.send(slashCommand('/minions', { text: 'hello' }))
    
            expect(axios.post).toHaveBeenNthCalledWith(
                1,
                expect.any(String),
                {
                    blocks: expect.arrayContaining(
                        [
                            {
                                text: {
                                    text: "`/minions hello` [USER]",
                                    type: "mrkdwn"
                                },
                                type: "section"
                            }
                        ]
                    ),
                    response_type: "in_channel"
                }
            )
        })
    })

    describe('/minions hello', () => {
        test('should return correct blockified message', async () => {
            await receiver.send(slashCommand('/minions', { text: 'hello' }))

            expect(axios.post).toHaveBeenLastCalledWith(
                expect.any(String),
                {
                    blocks: expect.arrayContaining(
                        [
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
                        ]
                    ),
                    response_type: "in_channel"
                }
            )
        })
    })
})