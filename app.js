const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'root@123',
  database: 'contact'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

const cors = require('cors');
const corsOpts = {
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOpts));
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin,Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,Authorization'
  );
  next();
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
        res.json({ data: user, token });
      });
    } else {
      res.status(401).json({ error: 'Invalid username or password' });
    }
  });
});

function createTableIfNotExists() {
  connection.query(`CREATE TABLE IF NOT EXISTS form (
    form_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    state VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    zip_code VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(255) NOT NULL,
    height VARCHAR(255) NOT NULL,
    height_type VARCHAR(255) NOT NULL,
    weight VARCHAR(255) NOT NULL,
    active INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`, (error, results) => {
    if (error) {
      console.error('Error creating table:', error);
      return;
    }
    console.log('Table created successfully');
  });
}

app.post('/form/save-details', (req, res) => {
  connection.query('SHOW TABLES LIKE "form"', (error, results) => {
    if (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      createTableIfNotExists();
    }

    const { first_name, middle_name, last_name, address, country, state, city, zip_code, email, phone_number, height, height_type, weight } = req.body;

    connection.query('SELECT * FROM form WHERE email = ?', [email], (error, rows) => {
      if (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (rows.length > 0) {
        return res.json({ error: 'Email already exists' });
      }

      connection.query('INSERT INTO form (first_name, middle_name, last_name, address, country, state, city, zip_code, email, phone_number, height, height_type, weight, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [first_name, middle_name, last_name, address, country, state, city, zip_code, email, phone_number, height, height_type, weight, 1],
        (error, results) => {
          if (error) {
            console.error('Error', error);
            return res.status(500).json({ error: 'Internal Server Error' });
          }

          const insertedId = results.insertId;
          connection.query('SELECT * FROM form WHERE form_id = ?', [insertedId], (err, rows) => {
            if (err) {
              console.error('Error:', err);
              return res.status(500).json({ error: 'Internal Server Error' });
            }

            const insertedData = rows[0];
            res.json({ message: 'Form details saved successfully', data: insertedData });
          });
        });
    });
  });
});

app.get('/form/list', (req, res) => {
  connection.query('SHOW TABLES LIKE "form"', (err, result) => {
    if (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (result.length === 0) {
      res.json({ error: 'No table existing' });
      return;
    }

    connection.query('SELECT * FROM form ORDER BY form_id DESC', (error, rows) => {
      if (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
      res.json({ data: rows });
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
    res.json({ message: `Form with ID ${formId} is Deleted Successfully` });
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
