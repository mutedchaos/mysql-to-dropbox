const log = require('karhu').context('app'),
  cp = require('child_process'),
  Dropbox = require('dropbox').Dropbox,
  fs = require('fs')

require('dotenv').config()
require('isomorphic-fetch')


async function run() {

  const accessToken = getEnv('DROPBOX_ACCESS_TOKEN')
  if (!accessToken) {
    throw new Error('DROPBOX_ACCESS_TOKEN is required')
  }
  const mysqlUsername = getEnv('MYSQL_USERNAME'),
    mysqlPassword = getEnv('MYSQL_PASSWORD'),
    mysqlDatabase = getEnv('MYSQL_DATABASE')

  log.info('Dumping database')
  await new Promise((resolve, reject) => cp.exec(`mysqldump -u${mysqlUsername} -p${mysqlPassword} ${mysqlDatabase}| gzip > /tmp/backbone.sql.gz`, (err, stdout, stderr) => {
    if (err) reject(err)
    else if (stderr.trim().replace('mysqldump: [Warning] Using a password on the command line interface can be insecure.', '')) reject(new Error(stderr))
    else resolve()
  }))


  const contents = fs.readFileSync('/tmp/backbone.sql.gz')

  const dropbox = new Dropbox({accessToken})
  const uploadInfo = {
    contents,
    path: '/backbone.sql.gz',
    mode: {'.tag': 'overwrite'},
    autorename: false,
    client_modified: new Date().toISOString().replace(/\.\d\d\d/, ''),
    mute: true,

  }
  log.info('Uploading to dropbox')
  const response = await dropbox.filesUpload(uploadInfo)

  log.info(response)

  log.info('Done.')
}

function getEnv(key) {
  const val = process.env[key]
  if (!val) throw new Error(key + ' required in environment')
  return val
}

run()
  .catch(err => {
    log.error(err.stack || err.message || err)
    process.exit(1)
  })