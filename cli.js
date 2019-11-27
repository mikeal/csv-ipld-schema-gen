#!/usr/bin/env node
const main = require('./')

const run = async argv => {
  const schemas = argv.files.map(f => main.fromFile(f))
  const strings = await Promise.all(schemas)
  console.log(strings.join('\n\n'))
}

// eslint-disable-next-line
require('yargs').command('$0 [files..]', 'Generate IPLD Struct from source csv files', () => {}, run).argv
