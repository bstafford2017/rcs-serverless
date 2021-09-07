const response = (body) => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
  },
  body: JSON.stringify(body)
})

const validationError = (message) => ({
  statusCode: 400,
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    message
  }
})

const serverError = (message) => ({
  statusCode: 500,
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    message
  }
})

module.exports = {
  response,
  validationError,
  serverError
}
