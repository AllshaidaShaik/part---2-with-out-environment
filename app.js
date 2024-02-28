const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'root@123',
  database: 'database'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

const JWT_SECRET_KEY = 'your_secret_key';

app.post('/login', (req, res) => {
  const { user_name, password } = req.body;

  connection.query('SELECT * FROM login WHERE user_name = ? AND password = ?', [user_name, password], (error, results) => {
    if (error) {
      console.error('Error', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (results.length > 0) {
      const user = results[0];
      const token = jwt.sign({ user_name: user.user_name }, JWT_SECRET_KEY);

      connection.query('INSERT INTO token (token, login_id, active) VALUES (?, ?, ?)', [token, user.login_id, 1], (err, result) => {
        if (err) {
          console.error('Error', err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }
        res.json({ login_details: user, token });
      });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  });
});

app.post('/form/save-details', (req, res) => {
  const { first_name, middle_name, last_name, address, country, state, city, zip_code, email, phone_number, height, height_type, weight } = req.body;

  connection.query('SELECT * FROM form WHERE email = ?', [email], (error, rows) => {
    if (error) {
      console.error('Error', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (rows.length > 0) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }

    connection.query('INSERT INTO form (first_name, middle_name, last_name, address, country, state, city, zip_code, email, phone_number, height, height_type, weight, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [first_name, middle_name, last_name, address, country, state, city, zip_code, email, phone_number, height, height_type, weight, 1],
      (error, results) => {
        if (error) {
          console.error('Error', error);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }

        const insertedId = results.insertId;

        connection.query('SELECT * FROM form WHERE form_id = ?', [insertedId], (err, rows) => {
          if (err) {
            console.error('Error', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
          }

          const insertedData = rows[0];
          res.json({ message: 'Form details saved successfully', data: insertedData });
        });
      });
  });
});

app.delete('/form/delete-details/:id', (req, res) => {
  const formId = req.params.id;

  connection.query('DELETE FROM form WHERE form_id = ?', [formId], (error, results) => {
    if (error) {
      console.error('Error', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }
    res.json({ message: `Form with ID ${formId} is deleted` });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
