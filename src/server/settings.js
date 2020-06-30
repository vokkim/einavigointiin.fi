const path = require('path')

const settings = {
  port: process.env.PORT ? Number(process.env.PORT) : 4999,
  production: process.env.NODE_ENV === 'production',
  chartsPath: process.env.CHARTS_PATH ? process.env.CHARTS_PATH : path.join(__dirname, '../../charts'),
  postgresConnection: process.env.POSTGRES = 'postgres://einavigointiinfi:einavigointiinfi@localhost:5432/einavigointiinfi'
}

console.log(`settings: ${JSON.stringify(settings, null, 2)}`)

module.exports = settings
