import { BlocksBase } from '../../lib/BlocksBase'

export class ListenBlocks extends BlocksBase {
  constructor (db, options) {
    super(db, options)
    this.Blocks = this.collections.Blocks
  }

  async start () {
    if (this.web3.isConnected()) {
      // node is syncing
      this.web3.eth.isSyncing((err, sync) => {
        this.log.debug('Node is syncing')
        if (!err) {
          this.updateStatus({ sync })

          if (sync === true) {
            this.web3.reset(true)
          } else if (sync) {
            let number = sync.currentBlock
            this.requestBlock(number)
          } else {
            this.listen()
          }
        } else {
          this.log.error('Syncing error', err)
        }
      })

      if (!this.web3.eth.syncing) {
        this.listen()
      }
    } else {
      this.log.warn('Web3 is not connected!')
      this.updateStatus()
      this.start()
    }
  }

  bulkRequest (args) {
    let action = this.actions.BULK_BLOCKS_REQUEST
    process.send({ action, args: [args] })
  }

  requestBlock (key, prioritize) {
    let action = this.actions.BLOCK_REQUEST
    process.send({ action, args: [key, prioritize] })
  }

  updateStatus (state) {
    let action = this.actions.STATUS_UPDATE
    process.send({ action, args: [state] })
  }

  listen () {
    this.log.info('Listen to blocks...')
    this.web3.reset(true)
    const filter = this.web3.eth.filter('latest')
    filter.watch((error, blockHash) => {
      if (error) {
        this.log.error('Filter Watch Error: ' + error)
      } else if (!blockHash) {
        this.log.warn('Warning: null block hash')
      } else {
        this.log.debug('New Block reported:', blockHash)
        this.requestBlock(blockHash, true)
      }
    })
  }
}

export function Blocks (db, config) {
  return new ListenBlocks(db, config)
}

export default ListenBlocks
