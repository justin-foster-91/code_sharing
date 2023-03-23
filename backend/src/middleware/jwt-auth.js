const AuthService = require('../auth-service')

function requireAuth(req, res, next) {
  const authToken = req.get('Authorization') || ''

  let bearerToken
  if (!authToken.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' })
  } else {
    bearerToken = authToken.slice(7, authToken.length)
  }

  try {
    const payload = AuthService.verifyJwt(bearerToken)
    // console.log(payload);
    AuthService.getUserWithUserName(
      req.app.get('db'),
      payload.sub,
    )
      .then(user => {
        if (!user)
          return res.status(401).json({ error: 'Unauthorized request' })

        req.user = user
        next()
      })
      .catch(err => {
        console.error(err)
        next(err)
      })
  } catch(error) {
    res.status(401).json({ error: 'Unauthorized request' })
  }
}

const requireAuthIfMe = (req, res, next) => {
  if(req.params.id === 'me'){
    requireAuth(req, res, next)
  } else {
    next()
  }
}

const requireAuthIfPrivate = async (req, res, next) => {
  let requestedInstance = await req.app.get('db')('instances')
    .where({id: req.params.id})
    .first()

  if(requestedInstance.is_public === false){
    requireAuth(req, res, next)
  } else {
    next()
  }
}

module.exports = {
  requireAuth,
  requireAuthIfMe,
  requireAuthIfPrivate
}
