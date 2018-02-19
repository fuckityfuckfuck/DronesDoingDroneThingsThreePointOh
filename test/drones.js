/* eslint-env mocha */
const Drones = require('../drones')
const expect = require('chai').expect
const config = require('../config.json')

describe('Drones.js - Drone management and utility module', function () {
  describe('Drones Constructor', function () {
    it('initializes correctly with no options', function () {
      const drones = new Drones()
      expect(drones.allConnected).to.deep.equal([])
      expect(drones.options).to.deep.equal({})
    })
    it('initializes correctly with options', function () {
      const drones = new Drones({
        port: 3000,
        parameter: 'param'
      })
      expect(drones.allConnected).to.deep.equal([])
      expect(drones.options).to.deep.equal({
        port: 3000,
        parameter: 'param'
      })
    })
  })
  describe('Drones.all', function () {
    const drones = new Drones()
    it('contains a drone for each unique id listed in the config', function () {
      const requestedIpAddresses = config.network.droneIdList.map(
        drones.ipTemplate
      )
      const ipAddresses = drones.all.map(drone => drone.ip)
      expect(requestedIpAddresses.every(
        requestedIpAddress => ipAddresses.includes(requestedIpAddress)
      ))
    })
  })
  describe('Drones.allConnected', function () {
    it('returns no drone objects when none are connected', function () {
      const drones = new Drones()
      const allConnected = drones.allConnected
      expect(allConnected).to.deep.equal([])
    })
  })
  describe('Drones.add', function () {
    it('successfully adds a drone', function () {
      const drones = new Drones()
      const idToAdd = 42
      delete drones.all.find(drone => drone.id === idToAdd)
      expect(!drones.containsId(idToAdd))
      drones.add(idToAdd)
      expect(drones.containsId(idToAdd))
    })
    it('returns pre-existing drone if there is one', function () {
      const drones = new Drones()
      const id = 42
      const preExistingDrone =
        drones.all.find(drone => drone.id === id) | drones.add(id)
      expect(preExistingDrone === drones.add(id))
    })
  })
})
