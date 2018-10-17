import { BigNumber } from 'bignumber.js'
import { BIG_NUMBER } from './types'

export const filterParams = (params, perPageMax = 50) => {
  params = params || {}
  let perPage = params.perPage || perPageMax
  perPage = (perPage <= perPageMax) ? perPage : perPageMax
  params.page = params.page || 1
  let limit = params.limit || perPage
  limit = limit <= perPage ? limit : perPage
  params.limit = limit
  params.query = filterQuery(params.query)
  params.sort = filterSort(params.sort)
  return params
}

export const filterQuery = (query) => {
  if (!query) return
  if (typeof (query) === 'object') {
    if (Object.keys(query).length > 0) {
      return sanitizeQuery(query)
    }
  }
}

export const filterSort = (sort) => {
  if (!sort) return
  let filtered = null
  if (sort && typeof (sort) === 'object') {
    let keys = Object.keys(sort)
    filtered = {}
    for (let k of keys) {
      let val = sort[k]
      filtered[k] = (!val || val === 1) ? 1 : -1
    }
  }
  return retFiltered(filtered)
}

const sanitizeQuery = (query) => {
  let filtered = {}
  for (let p in query) {
    let k = p.replace('$', '')
    if (k === p) filtered[k] = query[p]
  }
  return retFiltered(filtered)
}

const retFiltered = (filtered) => {
  return (filtered && Object.keys(filtered).length > 0) ? filtered : null
}

export const isAddress = address => {
  return /^(0x)?[0-9a-f]{40}$/i.test(address)
}

export const isValidAddress = address => {
  throw new Error('Not impemented')
}

export const bigNumberDoc = bigNumber => {
  return '0x' + bigNumber.toString(16)
}

export const isBigNumber = value => {
  return isObj(value) && (
    (value._isBigNumber === true) ||
    (value.isBigNumber === true) ||
    (value instanceof BigNumber) ||
    (value.lte && value.toNumber))
}

export const serializeBigNumber = value => {
  return (isBigNumber(value)) ? bigNumberDoc(value) : value
}

export const isSerializedBigNumber = value => {
  return value.type && value.value && value.type === BIG_NUMBER
}

export const unSerializeBigNumber = value => {
  return (isSerializedBigNumber(value)) ? new BigNumber(value.value) : value
}

export const bigNumberToSring = bn => {
  if (bn.type && bn.type === BIG_NUMBER) return bn.value
  if (isBigNumber(bn)) return bn.toString()
  return bn
}

const isObj = (value) => {
  if (undefined === value || value === null) return false
  let is = (typeof value === 'object')
  is = (is) ? (value instanceof Array === false) : is
  return is
}

export const serialize = (obj) => {
  if (typeof obj !== 'object') return obj
  if (isBigNumber(obj)) return serializeBigNumber(obj)
  let serialized = {}
  for (let p in obj) {
    let value = obj[p]
    if (value !== null && typeof value === 'object') {
      if (value instanceof Array) {
        serialized[p] = value.map(v => serialize(v))
      } else {
        if (!isBigNumber(value)) serialized[p] = serialize(value)
        else serialized[p] = serializeBigNumber(value)
      }
    } else {
      serialized[p] = value
    }
  }
  return serialized
}

export const checkBlockHash = value => {
  value = String(value).toLowerCase()
  if (/^(0x)[0-9a-f]{64}$/.test(value)) return value
  if (/^[0-9a-f]{64}$/.test(value)) return '0x' + value
  return null
}

export const isBlockHash = value => checkBlockHash(value) !== null

export const blockQuery = (blockHashOrNumber) => {
  const hash = (isBlockHash(blockHashOrNumber)) ? blockHashOrNumber : null
  const number = parseInt(blockHashOrNumber)
  if (hash) return { hash }
  if (number || number === 0) return { number }
  return null
}

const blockTotalDiff = block => bigNumberToSring(block.totalDifficulty)

// COMPLETe
export const getBestBlock = blocks => {
  blocks.sort((a, b) => {
    let aDiff = blockTotalDiff(a)
    let bDiff = blockTotalDiff(b)
    if (aDiff > bDiff) return -1
    if (aDiff < bDiff) return 1
    return 0
  })
  return blocks[0]
}
