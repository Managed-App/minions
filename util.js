const stripAnsi = (raw) =>
  raw.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  )

const wrapMarkdownCode = (raw) => '```' + raw + '```'

const wait = (ms) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(ms)
    }, ms)
  })

const promiseWrapper = (promise) =>
  Promise.allSettled([promise]).then(([{ value, reason }]) => [value, reason])

module.exports = { wait, stripAnsi, wrapMarkdownCode, promiseWrapper }
