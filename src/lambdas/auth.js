const { verify } = require('jsonwebtoken')
const { validationError } = require('../utils')

const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {}
  authResponse.principalId = principalId
  if (effect && resource) {
    const policyDocument = {}
    policyDocument.Version = '2012-10-17'
    policyDocument.Statement = []
    const statementOne = {}
    statementOne.Action = 'execute-api:Invoke'
    statementOne.Effect = effect
    statementOne.Resource = resource
    policyDocument.Statement[0] = statementOne
    authResponse.policyDocument = policyDocument
  }
  return authResponse
}

const authenticate = async (event) => {
  const { authorizationToken } = event
  if (!authorizationToken) {
    return validationError('Unauthorized')
  }

  // Remove 'Bearer '
  const token = authorizationToken.substring(7, authorizationToken.length)
  try {
    const id = verify(token, 'SECRET')
    if (!id) {
      return validationError('Unauthorized')
    }
    return generatePolicy(token.sub, 'Allow', event.methodArn)
  } catch (e) {
    return validationError('Unauthorized')
  }
}

module.exports = {
  authenticate
}
