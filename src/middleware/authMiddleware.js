const jwt = require('jsonwebtoken');

// Secret for JWT - In a real app, this should be in an environment variable
const jwtSecret = 'supersecretjwtkey';

const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.manager = decoded.manager;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;