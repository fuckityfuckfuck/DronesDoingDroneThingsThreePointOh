const server = require('./server')
const Drones = require('./drones')
const config = require('./config.json')
const drones = new Drones({
  log: config.log
})

// This is like this so we don't have to put server in the drone's namespace
drones.bindServerRoutes(server)
