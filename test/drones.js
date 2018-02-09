/* eslint-env mocha */
var Drones = require('../drones')
var expect = require('chai').expect

describe('Drones.js - Drone management and utility module', function () {
  describe('Drones Constructor', function () {
    it('initializes correctly with no options', function () {
      let drones = new Drones()
      expect(drones.allConnected).to.deep.equal([])
      expect(drones.options).to.deep.equal({})
    })
    it('initializes correctly with options', function () {
      let drones = new Drones({
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
    it('returns no drone objects', function () {
      let drones = new Drones()
      let allConnected = drones.allConnected
      expect(allConnected).to.deep.equal([])
    })
  })
})
