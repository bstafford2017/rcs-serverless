const { DynamoDB } = require('aws-sdk')
const { response } = require('../utils/index')
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
        TableName: process.env.EVENTS_TABLE,
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': id
        }
      })
      .promise()
    callback(null, response(200, { events: Items }))
  } catch (e) {
    callback(null, response(500, e))
  }
}

const getEvents = async (_, __, callback) => {
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.EVENTS_TABLE
      })
      .promise()
    callback(null, response(200, { events: Items }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

const createEvent = async (event, _, callback) => {
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
    callback(null, response(400, { msg: 'Please specify all fields.' }))
  }

  try {
    // Verify date
    const verifyStartDate = new Date(startDate)
    const verifyEndDate = new Date(endDate)
    if (verifyStartDate.getTime() >= verifyEndDate.getTime()) {
      callback(
        null,
        response(400, { msg: 'Please specify a valid date period' })
      )
    }

    // Verify time
    const verifyStartTime = new Date('1970-01-01T' + startTime + 'Z')
    const verifyEndTime = new Date('1970-01-01T' + endTime + 'Z')
    if (verifyStartTime.getTime() >= verifyEndTime.getTime()) {
      callback(
        null,
        response(400, { msg: 'Please specify a valid time period' })
      )
    }
  } catch (e) {
    callback(null, response(400, { msg: 'Please specify valid dates/times' }))
  }

  // Verify recur list
  if (recur.some((day) => !validWeekdays.includes(day))) {
    callback(null, response(400, { msg: 'Please specify valid weekdays' }))
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
  } catch (e) {
    callback(null, response(500, e.message))
  }

  if (existingUsers.length === 0) {
    callback(null, response(500, 'User id does not exist'))
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
  } catch (e) {
    callback(null, response(500, e.message))
  }

  if (existingRooms.length === 0) {
    callback(null, response(500, 'Room id does not exist'))
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
    callback(null, response(200, { events: [newEvent] }))
  } catch (e) {
    callback(null, response(500, e.message))
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
    callback(null, response(400, { msg: 'Please specify all fields.' }))
  }

  try {
    // Verify date
    const verifyStartDate = new Date(startDate)
    const verifyEndDate = new Date(endDate)
    if (verifyStartDate.getTime() >= verifyEndDate.getTime()) {
      callback(
        null,
        response(400, { msg: 'Please specify a valid date period' })
      )
    }

    // Verify time
    const verifyStartTime = new Date('1970-01-01T' + startTime + 'Z')
    const verifyEndTime = new Date('1970-01-01T' + endTime + 'Z')
    if (verifyStartTime.getTime() >= verifyEndTime.getTime()) {
      callback(
        null,
        response(400, { msg: 'Please specify a valid time period' })
      )
    }
  } catch (e) {
    callback(null, response(400, { msg: 'Please specify valid dates/times' }))
  }

  // Verify recur list
  if (recur.some((day) => validWeekdays.includes(day))) {
    callback(null, response(400, { msg: 'Please specify valid weekdays' }))
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
    callback(null, response(500, e.message))
  }

  if (existingEvents.length === 0) {
    callback(null, response(500, 'Event id does not exist'))
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
  } catch (e) {
    callback(null, response(500, e.message))
  }

  if (existingUsers.length === 0) {
    callback(null, response(500, 'User id does not exist'))
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
  } catch (e) {
    callback(null, response(500, e.message))
  }

  if (existingRooms.length === 0) {
    callback(null, response(500, 'Room id does not exist'))
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
    callback(null, response(200, { events: [newEvent] }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

const deleteEvent = async (event, _, callback) => {
  const { pathParameters } = event
  const { id } = pathParameters

  if (!id) {
    callback(null, response(400, { msg: 'Please specify all fields.' }))
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
    callback(null, response(500, e.message))
  }

  if (existingEvents.length === 0) {
    callback(null, response(500, 'Event id does not exist'))
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
    callback(null, response(200, { events: [{ id }] }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

module.exports = {
  getEvent,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent
}
