
const authMiddleware = (req, res, next) => {
  const token = req.headers['x-auth-token'];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // In a real application, you would verify the token (e.g., using jwt.verify)
  // For now, we'll just check if a token exists.
  if (token === 'fake-jwt-token') { // This should be replaced with actual JWT verification
    next();
  } else {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
