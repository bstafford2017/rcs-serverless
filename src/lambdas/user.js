const { DynamoDB } = require('aws-sdk')
const { response } = require('../utils/index')
const { v4: uuid } = require('uuid')

const db = new DynamoDB.DocumentClient()

const getUser = async (event, _, callback) => {
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
        TableName: process.env.USERS_TABLE,
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': id
        }
      })
      .promise()
    callback(null, response(200, { users: Items }))
  } catch (e) {
    callback(null, response(500, e))
  }
}

const getUsers = async (_, __, callback) => {
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.USERS_TABLE
      })
      .promise()
    callback(null, response(200, { users: Items }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

const createUser = async (event, _, callback) => {
  const { body } = event
  const { username, password, firstName, lastName, admin = false } = JSON.parse(
    body
  )

  if (!username || !password || !firstName || !lastName) {
    callback(null, response(400, { msg: 'Please specify all fields.' }))
  }

  const user = {
    id: uuid(),
    username,
    password,
    firstName,
    lastName,
    admin
  }

  try {
    await db
      .put({
        TableName: process.env.USERS_TABLE,
        Item: user
      })
      .promise()
    callback(null, response(200, { users: [user] }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

const updateUser = async (event, _, callback) => {
  const { pathParameters } = event
  const { id } = pathParameters

  const { body } = event
  const { username, password, firstName, lastName, admin = false } = JSON.parse(
    body
  )

  if (!id || !username || !password || !firstName || !lastName) {
    callback(null, response(400, { msg: 'Please specify all fields.' }))
  }

  const user = {
    id,
    username,
    password,
    firstName,
    lastName,
    admin
  }

  try {
    await db
      .update({
        TableName: process.env.USERS_TABLE,
        Key: {
          id
        },
        UpdateExpression:
          'set username=:username, password=:password, firstName=:firstName, lastName=:lastName, admin=:admin',
        ExpressionAttributeValues: {
          ':username': username,
          ':password': password,
          ':firstName': firstName,
          ':lastName': lastName,
          ':admin': admin
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()
    callback(null, response(200, { users: [user] }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

const deleteUser = async (event, _, callback) => {
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
        TableName: process.env.USERS_TABLE,
        Key: {
          id
        }
      })
      .promise()
    callback(null, response(200, { users: [{ id }] }))
  } catch (e) {
    callback(null, response(500, e.message))
  }
}

module.exports = {
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser
}
