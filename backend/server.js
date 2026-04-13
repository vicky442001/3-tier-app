const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  max: 20,
  idleTimeoutMillis: 30000,
});

async function connectDB() {
  let retries = 10;

  while (retries) {
    try {
      await pool.query("SELECT 1");
      console.log("Postgres connected");
      return;
    } catch (err) {
      console.log("DB not ready, retrying...");
      retries--;
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  console.error("Unable to connect to database");
  process.exit(1);
}

connectDB();

app.get('/api/health', (req, res) => {
  res.status(200).send("OK");
});

app.get('/api/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM todos ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { task } = req.body;

    const result = await pool.query(
      'INSERT INTO todos(task) VALUES($1) RETURNING *',
      [task]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Insert failed");
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM todos WHERE id=$1',
      [id]
    );

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).send("Delete failed");
  }
});

const server = app.listen(3000, () => {
  console.log("Backend running on port 3000");
});

process.on("SIGTERM", () => {
  console.log("Shutting down...");
  server.close(() => {
    pool.end();
  });
});