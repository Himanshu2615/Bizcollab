const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find User to get real-time Tenant ID
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Attach user and tenantId
    req.user = user;
    req.admin = user; // Legacy support
    req.tenantId = user.tenantId;

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
  }
};

module.exports = authMiddleware;
