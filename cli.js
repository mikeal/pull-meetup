#!/usr/bin/env node
const fs = require('fs')
const search = require('./')

require('yargs') // eslint-ignore-line
  .command({
    command: '$0 <term>',
    desc: 'Generate a CSV file from a meetup search term.',
    builder: yargs => {
      yargs.option('token', {
        default: process.env.MEETUP_TOKEN
      })
      yargs.positional('term', {
        desc: 'Search term, example: "IPFS"',
        required: true
      })
      yargs.option('output', {
        desc: 'Option file to write output, defaults to stdout',
        default: false
      })
    },
    handler: async argv => {
      let csv = await search(argv.term, argv.token)
      if (!argv.output) {
        console.log(csv)
      } else {
        fs.writeFileSync(argv.output, Buffer.from(csv))
      }
    }
  })
  .argv

