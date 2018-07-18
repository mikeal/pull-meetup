const bent = require('bent')
const qs = require('querystring')
const pkg = require('./package')
const headers = {
  'user-agent': `${pkg.name}/${pkg.version}`
}
const html2txt = require('html-to-text')
const csvWriter = require('csv-write-stream')

const toCSV = results => new Promise((resolve, reject) => {
  const headers = ['name', 'city', 'country','lat', 'lon', 'link', 'next']
  const stream = csvWriter({headers})
  const parts = []
  stream.on('data', part => parts.push(part))
  stream.on('error', reject)
  stream.on('end', () => {
    resolve(parts.join(''))
  })
  results.forEach(r => stream.write(r))
  stream.end()
})

const clean = obj => {
  for (let [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && value.startsWith('<')) {
      obj[key] = html2txt.fromString(value)
    }
  }
  return obj
}

const get = bent(headers, 'https://api.meetup.com')

const toJSON = stream => new Promise((resolve, reject) => {
  stream.on('error', reject)
  let parts = []
  stream.on('data', chunk => parts.push(chunk))
  stream.on('end', () => {
    let buff = Buffer.concat(parts)
    resolve(JSON.parse(buff.toString()))
  })
})

const byTopic = async () => {
  let query = {
    only: 'city,country,description,group_photo.photo_link,lat,link,lon,name',
    key: process.env.MEETUP_TOKEN,
    topic: 'IPFS',
    category_id: 34
  }

  const get = bent(headers, 'https://api.meetup.com', 'json')
  let u = '/2/groups?' + qs.stringify(query)
  let res = await get(u)
  console.log(res)
}

const _req = async (query, results) => {
  let u = '/find/groups?' + qs.stringify(query)
  let res = await get(u)
  let _results = await toJSON(res)
  _results.forEach(r => results.push(clean(r)))
  let count = parseInt(res.headers['x-total-count'])
  if (count > results.length) {
    query.offset += 1
    await _req(query, results)
  }
  return results
}

const bySearch = async (term) => {
  let query = {
    only: 'city,country,lat,link,lon,name,next_event.time,last_event.time',
    key: process.env.MEETUP_TOKEN,
    text: term,
    page: 200,
    offset: 0,
    radius: 'global',
    category_id: 34
  }

  let results = await _req(query, [])
  results.forEach(r => {
    if (r.next_event) {
      let dt = new Date(r.next_event.time)
      let [year, month, day] = dt.toISOString().split('T')[0].split('-')
      r.next = `=DATE(${year};${month};${day})`
    }
  })

  console.log(await toCSV(results))
}
bySearch('IPFS')
// bySearch('dapps')
// bySearch('distributed web')