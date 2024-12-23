const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).send('Acceso denegado');
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded;  // Agregar la información del usuario al objeto de solicitud
    next();
  } catch (error) {
    res.status(401).send('Token inválido');
  }
};

module.exports = authenticate;
