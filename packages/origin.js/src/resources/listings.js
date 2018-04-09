// For now, we are just wrapping the methods that are already in
// contractService and ipfsService.

class Listings {
  constructor({ contractService, ipfsService }) {
    this.contractService = contractService
    this.ipfsService = ipfsService
  }

  async allIds() {
    return await this.contractService.getAllListingIds()
  }

  async getByIndex(listingIndex) {
    const contractData = await this.contractService.getListing(
      listingIndex
    )
    const ipfsData = await this.ipfsService.getFile(
      contractData.ipfsHash
    )
    // ipfsService should have already checked the contents match the hash,
    // and that the signature validates

    // We explicitly set these fields to white list the allowed fields.
    const listing = {
      name: ipfsData.data.name,
      category: ipfsData.data.category,
      description: ipfsData.data.description,
      location: ipfsData.data.location,
      pictures: ipfsData.data.pictures,

      address: contractData.address,
      index: contractData.index,
      ipfsHash: contractData.ipfsHash,
      sellerAddress: contractData.lister,
      price: contractData.price,
      unitsAvailable: contractData.unitsAvailable
    }

    // TODO: Validation

    return listing
  }

  async create(data, schemaType) {
    if (data.price == undefined) {
      throw "You must include a price"
    }
    if (data.name == undefined) {
      throw "You must include a name"
    }

    let formListing = { formData: data }

    // TODO: Why can't we take schematype from the formListing object?
    const jsonBlob = {
      'schema': `http://localhost:3000/schemas/${schemaType}.json`,
      'data': formListing.formData,
    }

    let ipfsHash
    try {
      // Submit to IPFS
      ipfsHash = await this.ipfsService.submitFile(jsonBlob)
    } catch (error) {
      throw new Error(`IPFS Failure: ${error}`)
    }

    console.log(`IPFS file created with hash: ${ipfsHash} for data:`)
    console.log(jsonBlob)

    // Submit to ETH contract
    const units = 1 // TODO: Allow users to set number of units in form
    let transactionReceipt
    try {
      transactionReceipt = await this.contractService.submitListing(
        ipfsHash,
        formListing.formData.price,
        units)
    } catch (error) {
      console.error(error)
      throw new Error(`ETH Failure: ${error}`)
    }

    // Success!
    console.log(`Submitted to ETH blockchain with transactionReceipt.tx: ${transactionReceipt.tx}`)
    return transactionReceipt
  }

  async buy(listingAddress, unitsToBuy, ethToPay) {
    return await this.contractService.buyListing(
      listingAddress,
      unitsToBuy,
      ethToPay
    )
  }
}

module.exports = Listings
