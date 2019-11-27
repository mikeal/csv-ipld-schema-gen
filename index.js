const fs = require('fs')
const path = require('path')
const { PassThrough } = require('stream')
const CsvReadableStream = require('csv-reader')

const defaults = { parseNumbers: true, parseBooleans: true, trim: true }
const createStream = opts => CsvReadableStream(opts)

const csvInfo = async reader => {
  let header
  const fields = {}
  for await (const row of reader) {
    if (!header) {
      header = row
      for (const key of header) {
        fields[key] = { types: {} }
      }
    } else {
      for (const key of header) {
        let value = row.shift()
        if (key.includes('(') && key.includes(')')) {
          value = JSON.parse(value)
        }
        let _type = typeof value
        if (_type === 'object') {
          _type = 'list'
          for (let v of value) {
            v = parseFloat(v)
            let _t
            if (isNaN(v)) _t = 'string'
            else _t = Number.isInteger(v) ? 'int' : 'float'

            if (!fields[key].types[_t]) fields[key].types[_t] = 0
            fields[key].types[_t] += 1
          }
        }
        if (_type === 'number') _type = Number.isInteger(value) ? 'int' : 'float'
        if (_type === 'string' && !value) _type = 'empty'
        if (!fields[key].types[_type]) fields[key].types[_type] = 0
        fields[key].types[_type] += 1
      }
    }
  }
  return fields
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1)

const infoToSchema = (name, fields) => {
  const props = []
  const deps = []
  for (const [field, { types }] of Object.entries(fields)) {
    const optional = types.empty
    const nullable = types.null
    const l = type => `${field} ${optional ? 'optional ' : ''}${nullable ? 'nullable ' : ''}${type}`
    if (types.list) {
      const subs = ['string', 'int', 'float', 'null'].map(s => types[s] ? s : null).filter(x => x)
      if (subs.length === 1) {
        deps.push(`type ${field}List [${cap(subs[0])}]`)
      } else {
        deps.push(`type ${field}Union {\n${subs.map(k => `  | ${cap(k)} ${k}`).join('\n')}\n}`)
        deps.push(`type ${field}List [${field}Union]`)
      }
      props.push(`${field} ${field}List`)
    } else if (types.string) {
      props.push(l('String'))
    } else if (types.float) {
      props.push(l('Float'))
    } else if (types.int) {
      props.push(l('Int'))
    } else {
      if (!optional || Object.keys(types).length !== 1) {
        throw new Error(`Can't serialize ${field} ${JSON.stringify(types)}`)
      }
    }
  }
  const _deps = deps.length ? `${deps.join('\n')}\n\n` : ''
  return `${_deps}type ${name} Struct {\n${props.map(s => `  ${s}`).join('\n')}\n}`
}

const fromFile = async (filename, opts = {}) => {
  const inputStream = fs.createReadStream(filename, 'utf8')
  const stream = createStream({ ...defaults, ...opts })
  const reader = inputStream.pipe(stream).pipe(new PassThrough({ objectMode: true }))
  const info = await csvInfo(reader)
  const name = path.basename(filename).replace(/\./g, '_')
  return infoToSchema(name, info)
}

exports.fromFile = fromFile
