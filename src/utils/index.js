const response = (status, body) => ({
  statusCode: status,
  header: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
})

module.exports = {
  response
}
