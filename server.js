const express = require('express')
const config = require('./config')

let server = express()

server.set('view engine', 'pug')
require('./routes')(server)

server.listen(config.network.port, () => {
  console.log(`Drone app listening on port ${config.network.port}`)
})
.on(`request`, (req, res) => {
  let requestAddress = req.header('x-forwarded-for') || req.connection.remoteAddress
  console.log(`[${requestAddress}] ${req.method} ${req.url}`)
})

server.use(express.json())

module.exports = server
