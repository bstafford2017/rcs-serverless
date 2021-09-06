const { DynamoDB } = require('aws-sdk')
const { response, serverError, validationError } = require('../utils/index')
const { v4: uuid } = require('uuid')

const db = new DynamoDB.DocumentClient()

const getRoom = async (event) => {
  const { pathParameters } = event
  const { id } = pathParameters

  if (!id) {
    return validationError('Please specify all fields.')
  }

  try {
    const { Items } = await db
      .scan({
        TableName: process.env.ROOMS_TABLE,
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': id
        },
        Limit: 1
      })
      .promise()
    return response({ rooms: Items })
  } catch ({ message }) {
    return serverError(message)
  }
}

const getRooms = async () => {
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.ROOMS_TABLE
      })
      .promise()
    return response({ rooms: Items })
  } catch ({ message }) {
    return serverError(message)
  }
}

const createRoom = async (event) => {
  const { body } = event
  const {
    number,
    seats,
    projector = false,
    building: { name }
  } = JSON.parse(body)

  if (!number || !seats || !name) {
    return validationError('Please specify all fields.')
  }

  // Get building id for the associated name
  let existingBuildings = []
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.ROOMS_TABLE,
        FilterExpression: '#building.#name = :name',
        ExpressionAttributeNames: {
          '#building': 'building',
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': name
        }
      })
      .promise()
    existingBuildings = Items
  } catch ({ message }) {
    return serverError(message)
  }

  const existingBuilding = existingBuildings[0] || {}
  const { id = uuid() } = existingBuilding

  const room = {
    id: uuid(),
    number,
    seats,
    projector,
    building: {
      id,
      name
    }
  }

  try {
    await db
      .put({
        TableName: process.env.ROOMS_TABLE,
        Item: room
      })
      .promise()
    return response({ rooms: [room] })
  } catch ({ message }) {
    return serverError(message)
  }
}

const updateRoom = async (event) => {
  const { pathParameters } = event
  const { id: roomId } = pathParameters

  const { body } = event
  const {
    number,
    seats,
    projector = false,
    building: { name }
  } = JSON.parse(body)

  if (!roomId || !number || !seats || !name) {
    return validationError('Please specify all fields.')
  }

  // Get building id for the associated name
  let existingBuildings = []
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.ROOMS_TABLE,
        FilterExpression: '#building.#name = :name',
        ExpressionAttributeNames: {
          '#building': 'building',
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': name
        }
      })
      .promise()
    existingBuildings = Items
  } catch ({ message }) {
    return serverError(message)
  }

  const existingBuilding = existingBuildings[0]
  const { id: buildingId = uuid() } = existingBuilding

  const room = {
    id: roomId,
    number,
    seats,
    projector,
    building: {
      id: buildingId ? buildingId : uuid(),
      name
    }
  }

  try {
    await db
      .update({
        TableName: process.env.ROOMS_TABLE,
        Key: {
          id: roomId
        },
        UpdateExpression:
          'set #number=:number, #seats=:seats, #projector=:projector, #building.#id=:id, #building.#name=:name',
        ExpressionAttributeNames: {
          '#building': 'building',
          '#name': 'name',
          '#id': 'id',
          '#number': 'number',
          '#seats': 'seats',
          '#projector': 'projector'
        },
        ExpressionAttributeValues: {
          ':number': number,
          ':seats': seats,
          ':projector': projector,
          ':id': buildingId,
          ':name': name
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()
    return response({ rooms: [room] })
  } catch ({ message }) {
    return serverError(message)
  }
}

const deleteRoom = async (event, _, callback) => {
  const { pathParameters } = event
  const { id } = pathParameters

  if (!id) {
    return validationError('Please specify all fields.')
  }

  try {
    await db
      .delete({
        TableName: process.env.ROOMS_TABLE,
        Key: {
          id
        }
      })
      .promise()
    return response({ rooms: [{ id }] })
  } catch ({ message }) {
    return serverError(message)
  }
}

module.exports = {
  getRoom,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom
}
