const { DynamoDB } = require('aws-sdk')
const { response, validationError, serverError } = require('../utils/index')
const { v4: uuid } = require('uuid')

const db = new DynamoDB.DocumentClient()

const getUser = async (event) => {
  const { pathParameters } = event
  const { id } = pathParameters

  if (!id) {
    return validationError('Please specify all fields.')
  }

  try {
    const { Items } = await db
      .scan({
        TableName: process.env.USERS_TABLE,
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': id
        },
        Limit: 1
      })
      .promise()
    return response({ users: Items })
  } catch ({ message }) {
    return serverError(message)
  }
}

const getUsers = async (_, __, callback) => {
  try {
    const { Items } = await db
      .scan({
        TableName: process.env.USERS_TABLE
      })
      .promise()
    return response({ users: Items })
  } catch ({ message }) {
    return serverError(message)
  }
}

const createUser = async (event) => {
  const { body } = event
  const { username, password, firstName, lastName, admin = false } = JSON.parse(
    body
  )

  if (!username || !password || !firstName || !lastName) {
    return validationError('Please specify all fields.')
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
    return response({ users: [user] })
  } catch ({ message }) {
    return serverError(message)
  }
}

const updateUser = async (event) => {
  const { pathParameters } = event
  const { id } = pathParameters

  const { body } = event
  const { username, password, firstName, lastName, admin = false } = JSON.parse(
    body
  )

  if (!id || !username || !password || !firstName || !lastName) {
    return validationError('Please specify all fields.')
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
    return response({ users: [user] })
  } catch ({ message }) {
    return serverError(message)
  }
}

const deleteUser = async (event) => {
  const { pathParameters } = event
  const { id } = pathParameters

  if (!id) {
    return validationError('Please specify all fields.')
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
    return response({ users: [{ id }] })
  } catch ({ message }) {
    return serverError(message)
  }
}

module.exports = {
  getUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser
}
