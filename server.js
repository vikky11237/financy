const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

// Database Setup
// connectionString starts with postgres://...
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Neon/Render
});

// Initialize Database
async function initDB() {
    try {
        await pool.query(`CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            amount REAL,
            category TEXT,
            description TEXT,
            date TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS loans (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            name TEXT,
            total_amount REAL,
            interest_rate REAL,
            tenure INTEGER,
            emi_amount REAL,
            start_date TEXT
        )`);

        await pool.query(`CREATE TABLE IF NOT EXISTS financials (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            month TEXT,
            income REAL,
            budget_limit REAL
        )`);
        console.log('Connected to the PostgreSQL database and tables verified.');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
}

initDB();

// Helper Wrapper for async routes
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Routes

// Signup
app.post('/signup', asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    try {
        const result = await pool.query(
            `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id`,
            [name, email, hash]
        );
        res.json({ message: 'User registered successfully', userId: result.rows[0].id });
    } catch (err) {
        if (err.constraint === 'users_email_key' || err.code === '23505') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        throw err;
    }
}));

// Login
app.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'All fields are required' });

    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (match) {
        res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
    } else {
        res.status(400).json({ error: 'Invalid password' });
    }
}));

// Helper
async function getUserIdByName(name) {
    const res = await pool.query('SELECT id FROM users WHERE name = $1', [name]);
    return res.rows[0] ? res.rows[0].id : null;
}

// Add Expense
app.post('/expenses', asyncHandler(async (req, res) => {
    const { userName, amount, category, description, date } = req.body;
    const userId = await getUserIdByName(userName);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
        `INSERT INTO expenses (user_id, amount, category, description, date) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [userId, amount, category, description, date]
    );
    res.json({ message: 'Expense added', id: result.rows[0].id });
}));

// Get Expenses
app.get('/expenses/:userName', asyncHandler(async (req, res) => {
    const userId = await getUserIdByName(req.params.userName);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC', [userId]);
    res.json(result.rows);
}));

// Delete Expense
app.delete('/expenses/:id', asyncHandler(async (req, res) => {
    await pool.query('DELETE FROM expenses WHERE id = $1', [req.params.id]);
    res.json({ message: 'Expense deleted' });
}));

// Update Expense
app.put('/expenses/:id', asyncHandler(async (req, res) => {
    const { amount, category, description, date } = req.body;
    await pool.query(
        'UPDATE expenses SET amount = $1, category = $2, description = $3, date = $4 WHERE id = $5',
        [amount, category, description, date, req.params.id]
    );
    res.json({ message: 'Expense updated' });
}));

// Add Loan
app.post('/loans', asyncHandler(async (req, res) => {
    const { userName, name, amount, interest, tenure, emi } = req.body;
    const userId = await getUserIdByName(userName);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const startDate = req.body.start_date || new Date().toISOString().split('T')[0];
    const result = await pool.query(
        `INSERT INTO loans (user_id, name, total_amount, interest_rate, tenure, emi_amount, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [userId, name, amount, interest, tenure, emi, startDate]
    );
    res.json({ message: 'Loan added', id: result.rows[0].id });
}));

// Delete Loan
app.delete('/loans/:id', asyncHandler(async (req, res) => {
    await pool.query('DELETE FROM loans WHERE id = $1', [req.params.id]);
    res.json({ message: 'Loan deleted' });
}));

// Update Loan
app.put('/loans/:id', asyncHandler(async (req, res) => {
    const { name, amount, interest, tenure, emi } = req.body;
    await pool.query(
        'UPDATE loans SET name = $1, total_amount = $2, interest_rate = $3, tenure = $4, emi_amount = $5 WHERE id = $6',
        [name, amount, interest, tenure, emi, req.params.id]
    );
    res.json({ message: 'Loan updated' });
}));

// Financials
app.post('/financials', asyncHandler(async (req, res) => {
    const { userName, income, budget, month } = req.body;
    const userId = await getUserIdByName(userName);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const check = await pool.query('SELECT id FROM financials WHERE user_id = $1 AND month = $2', [userId, month]);
    if (check.rows.length > 0) {
        await pool.query('UPDATE financials SET income = $1, budget_limit = $2 WHERE id = $3', [income, budget, check.rows[0].id]);
        res.json({ message: 'Financials updated' });
    } else {
        const result = await pool.query(
            'INSERT INTO financials (user_id, month, income, budget_limit) VALUES ($1, $2, $3, $4) RETURNING id',
            [userId, month, income, budget]
        );
        res.json({ message: 'Financials set', id: result.rows[0].id });
    }
}));

// Analysis
app.get('/analysis/:userName', asyncHandler(async (req, res) => {
    const userId = await getUserIdByName(req.params.userName);
    if (!userId) return res.status(404).json({ error: 'User not found' });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const responseData = {
        financials: { income: 0, budgetLimit: 0, remainingBudget: 0, spendableIncome: 0, totalSpent: 0 },
        activeLoans: 0,
        totalMonthlyEmi: 0,
        loans: []
    };

    // 1. Financials
    const finRes = await pool.query('SELECT * FROM financials WHERE user_id = $1 AND month = $2', [userId, currentMonth]);
    if (finRes.rows[0]) {
        responseData.financials.income = finRes.rows[0].income;
        responseData.financials.budgetLimit = finRes.rows[0].budget_limit;
    }

    // 2. Total Expenses
    const expRes = await pool.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = $1', [userId]);
    const totalExpenses = expRes.rows[0].total || 0;
    responseData.financials.totalSpent = totalExpenses;

    // 3. Loans
    const loanRes = await pool.query('SELECT * FROM loans WHERE user_id = $1', [userId]);
    const loanRows = loanRes.rows;
    let totalEmi = 0;

    if (loanRows.length > 0) {
        responseData.activeLoans = loanRows.length;
        responseData.loans = loanRows.map(loan => {
            totalEmi += loan.emi_amount;

            const start = new Date(loan.start_date);
            const now = new Date();
            let monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
            if (monthsPassed < 0) monthsPassed = 0;

            // Amortization
            let balance = loan.total_amount;
            const r = (loan.interest_rate / 12) / 100;
            let totalInterest = 0;
            let totalPrincipal = 0;
            const iterations = Math.min(monthsPassed, loan.tenure);

            for (let i = 0; i < iterations; i++) {
                let interest = balance * r;
                let principal = loan.emi_amount - interest;
                if (balance < principal) principal = balance;
                balance -= principal;
                totalInterest += interest;
                totalPrincipal += principal;
                if (balance <= 0) break;
            }

            const completion = Math.min(100, Math.round((iterations / loan.tenure) * 100));

            return {
                id: loan.id,
                name: loan.name,
                totalAmount: loan.total_amount,
                emi: loan.emi_amount,
                tenure: loan.tenure,
                interest: loan.interest_rate,
                startDate: loan.start_date,
                monthsPaid: iterations,
                completion: completion,
                interestPaid: totalInterest.toFixed(2),
                principalPaid: totalPrincipal.toFixed(2),
                principalRemaining: Math.max(0, balance).toFixed(2)
            };
        });
    }
    responseData.totalMonthlyEmi = totalEmi;

    // 4. Final
    responseData.financials.remainingBudget = responseData.financials.budgetLimit - totalExpenses;
    responseData.financials.spendableIncome = responseData.financials.income - totalEmi - totalExpenses;

    res.json(responseData);
}));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
