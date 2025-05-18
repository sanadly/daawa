const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3002;

app.use(express.json());

// JWT secret key
const JWT_SECRET = 'your-secret-key';

// Enum for roles
const Role = {
  USER: 'USER',
  STAFF: 'STAFF',
  ORGANIZER: 'ORGANIZER',
  ADMIN: 'ADMIN'
};

// Sample user database
const users = [
  { id: 1, email: 'user@example.com', password: 'password', role: Role.USER },
  { id: 2, email: 'staff@example.com', password: 'password', role: Role.STAFF },
  { id: 3, email: 'organizer@example.com', password: 'password', role: Role.ORGANIZER },
  { id: 4, email: 'admin@example.com', password: 'password', role: Role.ADMIN }
];

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// RBAC middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRole = req.user.role;
    
    if (!userRole) {
      return res.status(403).json({ message: 'User role not defined' });
    }
    
    if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
      next();
    } else {
      return res.status(403).json({
        message: `Access Denied: Your role (${userRole}) is not authorized`,
        requiredRoles: allowedRoles
      });
    }
  };
};

// Login endpoint
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.json({ access_token: token });
});

// Public endpoint
app.get('/', (req, res) => {
  res.send('Hello World! This is a public endpoint');
});

// RBAC protected endpoints
app.get('/rbac/authenticated', authenticate, (req, res) => {
  res.json({
    message: 'This data is accessible to any authenticated user',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

app.get('/rbac/staff', authenticate, authorize(Role.STAFF, Role.ORGANIZER, Role.ADMIN), (req, res) => {
  res.json({
    message: 'This data is accessible to STAFF, ORGANIZER, and ADMIN users',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

app.get('/rbac/organizer', authenticate, authorize(Role.ORGANIZER, Role.ADMIN), (req, res) => {
  res.json({
    message: 'This data is accessible to ORGANIZER and ADMIN users',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

app.get('/rbac/admin', authenticate, authorize(Role.ADMIN), (req, res) => {
  res.json({
    message: 'This data is only accessible to ADMIN users',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(port, () => {
  console.log(`RBAC Demo server running at http://localhost:${port}`);
}); 