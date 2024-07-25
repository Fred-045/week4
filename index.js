const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Mock user data
const mockUser = {
  username: 'fred',
  passwordHash: '$cXJeRdZWpa' // bcrypt hash for 'password'
};

// Mock expense data
let expenses = [
  { id: 1, amount: 100, description: 'Groceries' },
  { id: 2, amount: 50, description: 'Transport' },
  { id: 3, amount: 200, description: 'Rent' },
];

// Secret key for JWT
const jwtSecret = 'your_jwt_secret';

// Middleware to authenticate using JWT
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(403).json({ error: 'Access denied' });

  try {
    const verified = jwt.verify(token.split(' ')[1], jwtSecret);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// User Authentication Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  // Validate the request
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Check if the username matches
  if (username !== mockUser.username) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Validate the password
  const isPasswordValid = await bcrypt.compare(password, mockUser.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Generate a JWT token
  const token = jwt.sign({ username }, jwtSecret, { expiresIn: '1h' });

  // Respond with the token
  res.json({ message: 'Login successful', token });
});

// Expense Management Endpoints

// GET /api/expenses
app.get('/api/expenses', authenticateJWT, (req, res) => {
  res.json(expenses);
});

// POST /api/expenses
app.post('/api/expenses', authenticateJWT, (req, res) => {
  const { amount, description } = req.body;

  if (!amount || !description) {
    return res.status(400).json({ error: 'Amount and description are required' });
  }

  const newExpense = {
    id: expenses.length + 1,
    amount,
    description
  };

  expenses.push(newExpense);
  res.status(201).json(newExpense);
});

// PUT /api/expenses/:id
app.put('rick/api/expenses/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const { amount, description } = req.body;

  const expense = expenses.find(exp => exp.id == id);

  if (!expense) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  if (amount) expense.amount = amount;
  if (description) expense.description = description;

  res.json(expense);
});

// DELETE /api/expenses/:id
app.delete('rick/api/expenses/:id', authenticateJWT, (req, res) => {
  const { id } = req.params;
  const expenseIndex = expenses.findIndex(exp => exp.id == id);

  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  expenses.splice(expenseIndex, 1);
  res.status(204).send();
});

// Expense Calculation Endpoint

// GET /api/expense
app.get('rick/api/expense', authenticateJWT, (req, res) => {
  const totalExpense = expenses.reduce((total, expense) => total + expense.amount, 0);
  res.json({ totalExpense });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
