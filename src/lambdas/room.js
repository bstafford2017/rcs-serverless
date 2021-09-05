const { DynamoDB } = require('aws-sdk')
const { response } = require('../utils/index')
const { v4: uuid } = require('uuid')

const db = new DynamoDB.DocumentClient()

const getRoom = async (event, _, callback) => {
  const { pathParameters } = event
  const { id } = pathParameters

  if (!id) {
    const errors = [
      {
        message: 'Please specify all fields.'
      }
    ]
    callback(null, response(400, { errors }))
  }

  try {
    const { Items } = await db
      .scan({
        TableName: process.env.ROOMS_TABLE,
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': id
        }
      })
      .promise()
    callback(null, response(200, { rooms: Items }))
  } catch (e) {
    callback(null, response(500, e))
  }
}

const getRooms = async (_, __, callback) => {
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.ROOMS_TABLE
      })
      .promise()
    callback(null, response(200, { rooms: Items }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

const createRoom = async (event, _, callback) => {
  const { body } = event
  const {
    number,
    seats,
    projector = false,
    building: { name }
  } = JSON.parse(body)

  if (!number || !seats || !name) {
    callback(null, response(400, { msg: 'Please specify all fields.' }))
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
  } catch (e) {
    callback(null, response(500, e.message))
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
    callback(null, response(200, { rooms: [room] }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

const updateRoom = async (event, _, callback) => {
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
    callback(null, response(400, { msg: 'Please specify all fields.' }))
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
  } catch (e) {
    callback(null, response(500, e.message))
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
    callback(null, response(200, { rooms: [room] }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

const deleteRoom = async (event, _, callback) => {
  const { pathParameters } = event
  const { id } = pathParameters

  if (!id) {
    const errors = [
      {
        message: 'Please specify all fields.'
      }
    ]
    callback(null, response(400, { errors }))
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
    callback(null, response(200, { rooms: [{ id }] }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

module.exports = {
  getRoom,
  getRooms,
  createRoom,
  updateRoom,
  deleteRoom
}
