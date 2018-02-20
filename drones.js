const arModule = require('ar-drone')
const config = require('./config.json')
const clientCommands = require('./clientCommands.json')

/**
 * Represents all drones and functions relevant to drones
 * @class
 */
class Drones {
  /** Constructor for Drones class
   * @constructor
   * @param {Object} options - Set of configuration options. (See parseOptions)
   */
  constructor (options) {
    this.droneList = []
    this.options = options || {}
    config.network.droneIdList.forEach(id => {
      this.add(id)
    })
    /*
     * The interval of navdata is usually < 75ms so 200ms is definitely
     * a reasonable threshold.
     * Currently we don't mind a little delay in the disconnection log but if
     * needed we can decrease the interval time here.
     */
    setInterval(() => this.timeoutDrones(200), 1000)
  }

  /**
   * Sets connected state of all drones that have not sent navdata in threshold
   * time to false.
   * Average navdata interval is < 75ms.
   * This function is called every second by a setInterval above
   */
  timeoutDrones (threshold) {
    let currentTime = Date.now()
    this.allConnected.forEach(drone => {
      let timedOut = currentTime - drone.latestConnection > threshold
      /* Only log if timeout is true drone.connected is true, this means that
         the drone is newly timed out */
      if (timedOut && drone.connected && this.options.log) {
        console.log(`Drone ${drone.id} disconnected`)
        /**
         * By default only navdata that is newer than the most recent recieved
         * navdata is sent on to the drone object, however, if a drone restarts,
         * it seems that it resets its 'sequenceNumber' count of the navdata
         * sent sofar, and so until it catches up to where it was before, the
         * arDrone module will ignore any navdata it sends. To avoid this, we
         * can reset the arDrone module's count as well. See
         * github.com/ennuuos/DronesDoingDroneThingsThreePointOh/issues/9
         */
        drone._udpNavdatasStream._sequenceNumber = 0
      }
      drone.connected = !timedOut
    })
  }

  /**
   * Returns an array of all drone objects, irregardless of if they are confirmed.
   * @returns {Drone[]} Array containing all drone objects.
   */
  get all () {
    return this.droneList
  }

  /**
   * Returns an array of all drone objects that are confirmed to be active.
   * @returns {Drone[]} Array containing all confirmed drone objects.
   * @todo Set up tests on this functions interaction with live drones.
   */
  get allConnected () {
    return this.all.filter(drone => drone.connected)
  }

  /**
   * Adds a new drone object to the list with the given id.
   * @param {int} id - Id of drone to create.
   * @returns {Drone} Newly created client object from ar-drone module or pre-existing object with same id.
   */
  add (id) {
    let drone
    let ip = this.ipTemplate(id) // e.g. 192.168.1.101
    if (this.containsId(id)) {
      drone = this.getDrone(id)
    } else {
      drone = arModule.createClient({ip: ip})
      this.droneList.push(drone)
    }
    drone.id = id
    drone.ip = ip
    drone.connected = false
    drone.flash = function () { this.animateLeds('blinkOrange', 5, 1) }
    drone.on('navdata', data => {
      if (data.demo) drone.navdata = data
      drone.latestConnection = Date.now()
      if (!drone.connected) this.connectDrone(drone)
    })
    return drone
  }

  /**
   * Sets up a drones connection.
   * @param {Drone} drone - The drone object for which to set up the connection.
   * @todo Set up tests on this functions interaction with live drones.
   */
  connectDrone (drone) {
    if (this.options.log) console.log(`Drone ${drone.id} connected`)
    // This will get the drone to send demo data again, which it may have
    // stopped doing if this is a reconnection:
    drone.resume()
    drone.connected = true
    drone.flash() // This animation lets us know the drone has connected
  }

  /**
   * Removes a drone from the list of drones.
   * @param {int} id - Id of drone to remove.
   */
  remove (id) {
    if (!this.containsId(id)) return false
    delete this.getDrone(id)
    return true
  }

  /**
   * Checks if a drone with a particular id exists.
   * @param {int} id - Id of drone to search for.
   * @returns {boolean} Weather a drone with id exists.
   */
  containsId (id) {
    return this.droneList.some(drone => drone.id === id)
  }

  /**
   * Gets the drone with the given id, if it exists.
   * @param {int} id - Id of drone to return.
   * @returns {Drone}
   */
  getDrone (id) {
    return this
      .all
      .find(drone => drone.id === id)
  }

  /**
   * Returns the ip to be used for a drone of a given id.
   * @param {int} id - The id to use to from the ip address.
   * @returns {string} The ip address.
   */
  ipTemplate (id) {
    return `${config.network.droneIpStub}${id}`
  }

  /**
   * Evaluate to a list of all drone statuses.
   * @todo Write the documentation.
   * @todo Set up tests on this functions interaction with live drones.
   */
  get statuses () {
    return this.allConnected.map(drone => this.status(drone))
  }

  /**
   * Return the status of a given drone.
   * @todo Write the documentation.
   * @todo Set up tests on this functions interaction with live drones.
   */
  status (drone) {
    return drone
    ? {
      id: drone.id,
      ip: drone.ip,
      // battery: drone.navdata.demo.battery,
      latestConnection: drone.latestConnection,
      navdata: drone.navdata
    }
    : undefined
  }

  /**
   * Bind for drone manipulation to express server
   * @todo Write the documentation.
   * @todo Test this function.
   * @todo move procedures into their own functions
   */
  bindServerRoutes (server) {
    server.get('/drones', (req, res) => {
      res.send(this.statuses)
    })
    server.get('/drones/:id', (req, res) => {
      let id = req.params['id']
      let drone = this.allConnected.find(drone => drone.id === id)
      if (drone) {
        res.send(this.status(drone))
      } else {
        res.sendStatus(404)
      }
    })
    server.post('/drones/command', (req, res) => {
      // Accepts a json list of {id, commandName, (maybe) degree} objects.
      // First ensure they are commanding an existing drone, then that the
      // command is valid, and then call the relevant function.
      req.body.filter(command => this.containsId(command.id)).filter(
        command => clientCommands
          .map(clientCommand => clientCommand.commandName)
          .includes(command.commandName)
      ).forEach(command => {
        if (clientCommands.find(
          clientCommand => clientCommand.commandName === command.commandName
        ).hasDegree) {
          this.getDrone(command.id)(command.degree | config.defaultDegree)
        } else { this.getDrone(command.id)() }
      })
      res.sendStatus(200)
    })
    server.post('/drones/:id', (req, res) => {
      let id = req.params['id']
      this.add(id)
      res.sendStatus(200)
    })
  }
}

module.exports = Drones
