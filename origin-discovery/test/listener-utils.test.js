const chai = require('chai')

const db = require('../src/models')
const { getLastBlock, setLastBlock } = require('../src/listener/utils')

const expect = chai.expect

describe('get/setLastBlock with continue file', () => {
  it(`Should return value set by setLastBlock`, async () => {
    const config = {
      continueFile: 'continueTest'
    }
    await setLastBlock(config, 123)
    const block = await getLastBlock(config)
    expect(block).to.equal(123)
  })
  it(`Should return default continue value when not state found`, async () => {
    const config = {
      continueFile: 'doesNotExist',
      defaultContinueBlock: 456
    }
    const block = await getLastBlock(config)
    expect(block).to.equal(456)
  })
})

describe('get/setLastBlock with DB', () => {
  it(`Should return value set by setLastBlock`, async () => {
    const config = {
      listenerId: 'test'
    }
    await setLastBlock(config, 789)
    const block = await getLastBlock(config)
    expect(block).to.equal(789)
  })
  it(`Should return default continue value when no state found`, async () => {
    // Delete listener state in the DB.
    db.Listener.destroy({
      where: {
        id: 'test'
      }
    })
    const config = {
      listenerId: 'test',
      defaultContinueBlock: 987
    }
    const block = await getLastBlock(config)
    expect(block).to.equal(987)
  })
})