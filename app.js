const log = require('karhu').context('app'),
  Dropbox = require('dropbox').Dropbox,
  mysqldump = require('mysqldump'),
  {deflate} = require('zlib')

require('dotenv').config()

async function run() {
  const accessToken = getEnv('DROPBOX_ACCESS_TOKEN')
  const filename = getEnv('DROPBOX_FILENAME')

  log.info('Dumping database')
  const dumpResult = await mysqldump({
    connection: {
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DB,
      password: process.env.MYSQL_PWD,
    },
  })

  const data = compress ? await compress(dumpResult.dump.data) : dumpResult.dump.data

  const dropbox = new Dropbox({accessToken})
  const uploadInfo = {
    contents: data,
    path: '/' + filename,
    mode: {'.tag': 'overwrite'},
    autorename: false,
    client_modified: new Date().toISOString().replace(/\.\d\d\d/, ''),
    mute: true,
  }
  log.info('Uploading to dropbox')

  await dropbox.filesUpload(uploadInfo)

  log.info('Done.')
}

function getEnv(key) {
  const val = process.env[key]
  if (!val) throw new Error(key + ' required in environment')
  return val
}

run().catch((err) => {
  log.error(err.stack || err.message || err)
  process.exit(1)
})

async function compress(data) {
  log.info('Compressing')
  return await new Promise((resolve, reject) => {
    deflate(data, (err, buffer) => {
      if (err) reject(err)
      else resolve(buffer)
    })
  })
}
