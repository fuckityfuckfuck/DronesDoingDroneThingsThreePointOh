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
      const id = 2
      const preExistingDrone =
        drones.all.find(drone => drone.id === id) | drones.add(id)
      expect(preExistingDrone === drones.add(id))
    })
  })
  describe('Drones.remove', function () {
    it('removes a drone and returns true if it is there', function () {
      const drones = new Drones()
      const idToRemove = 27
      drones.add(idToRemove)
      expect(drones.containsId(idToRemove))
      expect(drones.remove(idToRemove))
      expect(!drones.containsId(idToRemove))
    })
    it('returns false if the drone does not exist', function () {
      const drones = new Drones()
      const idToRemove = 83
      drones.remove(idToRemove)
      expect(!drones.remove(idToRemove))
    })
  })
  describe('Drones.containsId', function () {
    it('returns true if the drone exists', function () {
      const drones = new Drones()
      const idToCheck = 19
      drones.add(idToCheck)
      expect(drones.containsId(idToCheck))
    })
    it('returns false if the drone does not exist', function () {
      const drones = new Drones()
      const idToCheck = 28
      drones.remove(idToCheck)
      expect(!drones.containsId(idToCheck))
    })
  })
  describe('Drones.getDrone', function () {
    it('returns the correct drone object if it exists', function () {
      const drones = new Drones()
      const idToCheck = 512
      const drone = drones.add(idToCheck)
      expect(drone === drones.getDrone(idToCheck))
    })
    it('returns undefined if there is no drone with the given id', function () {
      const drones = new Drones()
      const idToCheck = 965
      drones.remove(idToCheck)
      expect(typeof drones.getDrone(idToCheck) === 'undefined')
    })
  })
  describe('Drones.ipTemplate', function () {
    it('works for example', function () {
      const id = 11
      expect((new Drones()).ipTemplate(id) === config.network.droneIpStub + id)
    })
  })
})
