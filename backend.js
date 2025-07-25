const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const bodyParser = require('body-parser')
const app = express()
const db = new sqlite3.Database('./bank.db')

app.use(bodyParser.json())

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS loans (
    loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT,
    principal REAL,
    period_years INTEGER,
    rate REAL,
    interest REAL,
    total_amount REAL,
    emi REAL,
    amount_paid REAL DEFAULT 0
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER,
    amount REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(loan_id) REFERENCES loans(loan_id)
  )`)
})

function calculateLoanDetails(P, N, R) {
  const I = P * N * R
  const A = P + I
  const emi = A / (N * 12)
  return { I, A, emi }
}

app.post('/lend', (req, res) => {
  const { customer_id, loan_amount, loan_period, rate_of_interest } = req.body
  const P = parseFloat(loan_amount)
  const N = parseInt(loan_period)
  const R = parseFloat(rate_of_interest)
  const { I, A, emi } = calculateLoanDetails(P, N, R)
  db.run(`INSERT INTO loans 
    (customer_id, principal, period_years, rate, interest, total_amount, emi) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [customer_id, P, N, R, I, A, emi],
    function(err) {
      if (err) return res.status(500).json({ error: err.message })
      res.status(201).json({
        loan_id: this.lastID,
        total_amount: Number(A.toFixed(2)),
        monthly_emi: Number(emi.toFixed(2))
      })
    })
})

app.post('/payment', (req, res) => {
  const { loan_id, payment_amount } = req.body
  const payment = parseFloat(payment_amount)
  db.get(SELECT total_amount, amount_paid, emi FROM loans WHERE loan_id = ?, [loan_id], (err, loan) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!loan) return res.status(404).json({ error: "Loan not found" })
    let new_amount_paid = loan.amount_paid + payment
    if (new_amount_paid > loan.total_amount) {
      payment_amount = loan.total_amount - loan.amount_paid
      new_amount_paid = loan.total_amount
    }
    db.run(INSERT INTO payments (loan_id, amount) VALUES (?, ?), [loan_id, payment_amount], err => {
      if (err) return res.status(500).json({ error: err.message })
      db.run(UPDATE loans SET amount_paid = ? WHERE loan_id = ?, [new_amount_paid, loan_id], err => {
        if (err) return res.status(500).json({ error: err.message })
        const remaining_amount = loan.total_amount - new_amount_paid
        const emi_left = Math.ceil(remaining_amount / loan.emi) || 0
        res.json({
          payment_received: Number(payment_amount.toFixed(2)),
          amount_paid_till_date: Number(new_amount_paid.toFixed(2)),
          emi_left
        })
      })
    })
  })
})

app.get('/ledger/:loan_id', (req, res) => {
  const loan_id = req.params.loan_id
  db.get(SELECT principal, interest, total_amount, emi, amount_paid FROM loans WHERE loan_id = ?, [loan_id], (err, loan) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!loan) return res.status(404).json({ error: "Loan not found" })
    db.all(SELECT amount, timestamp FROM payments WHERE loan_id = ? ORDER BY timestamp, [loan_id], (err, payments) => {
      if (err) return res.status(500).json({ error: err.message })
      const remaining_amount = loan.total_amount - loan.amount_paid
      const emi_left = Math.ceil(remaining_amount / loan.emi) || 0
      res.json({
        loan_id: Number(loan_id),
        principal: Number(loan.principal.toFixed(2)),
        interest: Number(loan.interest.toFixed(2)),
        total_amount: Number(loan.total_amount.toFixed(2)),
        monthly_emi: Number(loan.emi.toFixed(2)),
        amount_paid: Number(loan.amount_paid.toFixed(2)),
        emi_left,
        payments: payments.map(p => ({ amount: Number(p.amount.toFixed(2)), timestamp: p.timestamp }))
      })
    })
  })
})

app.get('/account/:customer_id', (req, res) => {
  const customer_id = req.params.customer_id
  db.all(SELECT loan_id, principal, interest, total_amount, emi, amount_paid, period_years, rate FROM loans WHERE customer_id = ?, [customer_id], (err, loans) => {
    if (err) return res.status(500).json({ error: err.message })
    if (!loans.length) return res.json({ loans: [] })
    const response = loans.map(loan => {
      const amount_paid = loan.amount_paid
      const remaining_amount = loan.total_amount - amount_paid
      const emi_left = Math.ceil(remaining_amount / loan.emi) || 0
      const total_interest = loan.interest
      return {
        loan_id: loan.loan_id,
        principal: Number(loan.principal.toFixed(2)),
        total_amount: Number(loan.total_amount.toFixed(2)),
        emi: Number(loan.emi.toFixed(2)),
        total_interest: Number(total_interest.toFixed(2)),
        amount_paid: Number(amount_paid.toFixed(2)),
        emi_left
      }
    })
    res.json({ loans: response })
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(Bank system API running on port ${PORT})
})