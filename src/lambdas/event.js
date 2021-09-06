const { DynamoDB } = require('aws-sdk')
const { response, validationError, serverError } = require('../utils/index')
const { v4: uuid } = require('uuid')

const db = new DynamoDB.DocumentClient()
const validWeekdays = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
]

const getEvent = async (event, _, callback) => {
  const { pathParameters } = event
  const { id } = pathParameters

  if (!id) {
    return validationError('Please specify all fields.')
  }

  try {
    const { Items } = await db
      .scan({
        TableName: process.env.EVENTS_TABLE,
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': id
        },
        Limit: 1
      })
      .promise()
    return response({ events: Items })
  } catch ({ message }) {
    return serverError(message)
  }
}

const getEvents = async () => {
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.EVENTS_TABLE
      })
      .promise()
    return response({ events: Items })
  } catch ({ message }) {
    return serverError(message)
  }
}

const createEvent = async (event) => {
  const { body } = event
  const {
    startTime,
    endTime,
    startDate,
    endDate,
    room,
    user,
    recur
  } = JSON.parse(body)

  if (
    !startTime ||
    !endTime ||
    !startDate ||
    !endDate ||
    !room ||
    !user ||
    !recur
  ) {
    return validationError('Please specify all fields.')
  }

  try {
    // Verify date
    const verifyStartDate = new Date(startDate)
    const verifyEndDate = new Date(endDate)
    if (verifyStartDate.getTime() >= verifyEndDate.getTime()) {
      return validationError('Please specify a valid date period.')
    }

    // Verify time
    const verifyStartTime = new Date('1970-01-01T' + startTime + 'Z')
    const verifyEndTime = new Date('1970-01-01T' + endTime + 'Z')
    if (verifyStartTime.getTime() >= verifyEndTime.getTime()) {
      return validationError('Please specify a valid time period.')
    }
  } catch ({ message }) {
    return serverError(message)
  }

  // Verify recur list
  if (recur.some((day) => !validWeekdays.includes(day))) {
    return validationError('Please specify valid weekdays.')
  }

  // Verify user exists
  let existingUsers = []
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.USERS_TABLE,
        FilterExpression: '#id = :id',
        ExpressionAttributeNames: {
          '#id': 'id'
        },
        ExpressionAttributeValues: {
          ':id': user
        }
      })
      .promise()
    existingUsers = Items
  } catch ({ message }) {
    return serverError(message)
  }

  if (existingUsers.length === 0) {
    return validationError('User id does not exist.')
  }

  // Verify room exists
  let existingRooms = []
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.ROOMS_TABLE,
        FilterExpression: '#id = :id',
        ExpressionAttributeNames: {
          '#id': 'id'
        },
        ExpressionAttributeValues: {
          ':id': room
        }
      })
      .promise()
    existingRooms = Items
  } catch ({ message }) {
    return serverError(message)
  }

  if (existingRooms.length === 0) {
    return validationError('Room id does not exist.')
  }

  const newEvent = {
    id: uuid(),
    startTime,
    endTime,
    startDate,
    endDate,
    room,
    user,
    recur
  }

  try {
    await db
      .put({
        TableName: process.env.EVENTS_TABLE,
        Item: newEvent
      })
      .promise()
    return response({ events: [newEvent] })
  } catch ({ message }) {
    return serverError(message)
  }
}

const updateEvent = async (event, _, callback) => {
  const { pathParameters } = event
  const { id } = pathParameters

  const { body } = event
  const {
    startTime,
    endTime,
    startDate,
    endDate,
    room,
    user,
    recur
  } = JSON.parse(body)

  if (
    !id ||
    !startTime ||
    !endTime ||
    !startDate ||
    !endDate ||
    !room ||
    !user ||
    !recur
  ) {
    return validationError('Please specify all fields.')
  }

  try {
    // Verify date
    const verifyStartDate = new Date(startDate)
    const verifyEndDate = new Date(endDate)
    if (verifyStartDate.getTime() >= verifyEndDate.getTime()) {
      return validationError('Please specify a valid date period.')
    }

    // Verify time
    const verifyStartTime = new Date('1970-01-01T' + startTime + 'Z')
    const verifyEndTime = new Date('1970-01-01T' + endTime + 'Z')
    if (verifyStartTime.getTime() >= verifyEndTime.getTime()) {
      return validationError('Please specify a valid time period.')
    }
  } catch ({ message }) {
    return serverError(message)
  }

  // Verify recur list
  if (recur.some((day) => validWeekdays.includes(day))) {
    return validationError('Please specify valid weekdays.')
  }

  // Verify event exists
  let existingEvents = []
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.EVENTS_TABLE,
        FilterExpression: '#id = :id',
        ExpressionAttributeNames: {
          '#id': 'id'
        },
        ExpressionAttributeValues: {
          ':id': id
        }
      })
      .promise()
    existingEvents = Items
  } catch ({ message }) {
    return serverError(message)
  }

  if (existingEvents.length === 0) {
    return validationError('Event id does not exist.')
  }

  // Verify user exists
  let existingUsers = []
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.USERS_TABLE,
        FilterExpression: '#id = :id',
        ExpressionAttributeNames: {
          '#id': 'id'
        },
        ExpressionAttributeValues: {
          ':id': user
        }
      })
      .promise()
    existingUsers = Items
  } catch ({ message }) {
    return serverError(message)
  }

  if (existingUsers.length === 0) {
    return validationError('User id does not exist.')
  }

  // Verify room exists
  let existingRooms = []
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.ROOMS_TABLE,
        FilterExpression: '#id = :id',
        ExpressionAttributeNames: {
          '#id': 'id'
        },
        ExpressionAttributeValues: {
          ':id': room
        }
      })
      .promise()
    existingRooms = Items
  } catch ({ message }) {
    return serverError(message)
  }

  if (existingRooms.length === 0) {
    return validationError('Room id does not exist.')
  }

  const newEvent = {
    id: id ? id : uuid(),
    startTime,
    endTime,
    startDate,
    endDate,
    room,
    user,
    recur
  }

  try {
    await db
      .update({
        TableName: process.env.EVENTS_TABLE,
        Key: {
          id
        },
        UpdateExpression:
          'set startTime=:startTime, endTime=:endTime, startDate=:startDate, endDate=:endDate, room=:room, #user=:user, recur=:recur',
        ExpressionAttributeNames: {
          '#user': 'user'
        },
        ExpressionAttributeValues: {
          ':startTime': startTime,
          ':endTime': endTime,
          ':startDate': startDate,
          ':endDate': endDate,
          ':room': room,
          ':user': user,
          ':recur': recur
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()
    return response({ events: [newEvent] })
  } catch ({ message }) {
    return serverError(message)
  }
}

const deleteEvent = async (event) => {
  const { pathParameters } = event
  const { id } = pathParameters

  if (!id) {
    return validationError('Please specify all fields.')
  }

  // Verify event exists
  let existingEvents = []
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.EVENTS_TABLE,
        FilterExpression: '#id = :id',
        ExpressionAttributeNames: {
          '#id': 'id'
        },
        ExpressionAttributeValues: {
          ':id': id
        }
      })
      .promise()
    existingEvents = Items
  } catch (e) {
    return response(500, { message: e.message })
  }

  if (existingEvents.length === 0) {
    return validationError('Event id does not exist.')
  }

  try {
    await db
      .delete({
        TableName: process.env.EVENTS_TABLE,
        Key: {
          id
        }
      })
      .promise()
    return response({ events: [{ id }] })
  } catch ({ message }) {
    return serverError(message)
  }
}

module.exports = {
  getEvent,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
}
