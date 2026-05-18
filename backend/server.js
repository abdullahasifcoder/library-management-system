const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://libuser:libpass@localhost:5432/librarydb',
});

// Basic Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT id, username, role FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      res.json({ success: true, user: result.rows[0] });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Books (Paginated & Server-side searched)
app.get('/api/books', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', filterMy = '' } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM books b
      LEFT JOIN users u ON b.borrowed_by = u.id
      LEFT JOIN book_categories bc ON b.id = bc.book_id
      LEFT JOIN categories c ON bc.category_id = c.id
      WHERE 1=1
    `;
    
    let params = [];
    let paramCount = 1;

    if (search) {
      baseQuery += ` AND (b.title ILIKE $${paramCount} OR b.author ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (filterMy) {
      baseQuery += ` AND b.borrowed_by = $${paramCount}`;
      params.push(filterMy);
      paramCount++;
    }

    if (category) {
      baseQuery += ` AND b.id IN (SELECT book_id FROM book_categories bc2 JOIN categories c2 ON bc2.category_id = c2.id WHERE c2.name = $${paramCount})`;
      params.push(category);
      paramCount++;
    }

    const countResult = await pool.query(`SELECT COUNT(DISTINCT b.id) ${baseQuery}`, params);
    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    // Grouping
    const selectQuery = `
      SELECT b.id, b.title, b.author, b.status, b.borrowed_by, u.username as borrower_name,
             COALESCE(array_agg(c.name) FILTER (WHERE c.name IS NOT NULL), '{}') as categories
      ${baseQuery}
      GROUP BY b.id, u.username
      ORDER BY b.id ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    const result = await pool.query(selectQuery, params);
    res.json({
      books: result.rows,
      currentPage: parseInt(page),
      totalPages,
      totalItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Get Audit History (borrow logs)
app.get('/api/history', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT h.id, b.title as book_title, u.username as user_name, h.borrowed_at, h.returned_at
      FROM borrow_history h
      JOIN books b ON h.book_id = b.id
      JOIN users u ON h.user_id = u.id
      ORDER BY h.borrowed_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Add Book
app.post('/api/books', async (req, res) => {
  const { title, author, categories } = req.body;
  try {
    await pool.query('BEGIN');
    const result = await pool.query('INSERT INTO books (title, author) VALUES ($1, $2) RETURNING *', [title, author]);
    const bookId = result.rows[0].id;
    
    if (categories && categories.length > 0) {
      for (const catId of categories) {
        await pool.query('INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)', [bookId, catId]);
      }
    }
    
    await pool.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// Admin Delete Book
app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // book_categories deleted automatically due to ON DELETE CASCADE
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Edit Book
app.put('/api/books/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, categories } = req.body;
  try {
    await pool.query('BEGIN');
    await pool.query('UPDATE books SET title = $1, author = $2 WHERE id = $3', [title, author, id]);
    
    await pool.query('DELETE FROM book_categories WHERE book_id = $1', [id]);
    
    if (categories && categories.length > 0) {
      for (const catId of categories) {
        await pool.query('INSERT INTO book_categories (book_id, category_id) VALUES ($1, $2)', [id, catId]);
      }
    }
    
    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// Admin Categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Analytics
app.get('/api/analytics', async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM books');
    const borrowed = await pool.query("SELECT COUNT(*) FROM books WHERE status = 'Borrowed'");
    const users = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'User'");
    res.json({
      totalBooks: parseInt(total.rows[0].count),
      borrowedBooks: parseInt(borrowed.rows[0].count),
      availableBooks: parseInt(total.rows[0].count) - parseInt(borrowed.rows[0].count),
      totalUsers: parseInt(users.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Get Users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, username, role FROM users WHERE role = 'User' ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Borrow Book
app.post('/api/borrow', async (req, res) => {
  const { bookId, userId } = req.body;
  try {
    await pool.query('BEGIN');
    const updateResult = await pool.query('UPDATE books SET status = $1, borrowed_by = $2 WHERE id = $3 AND status = $4', ['Borrowed', userId, bookId, 'Available']);
    if (updateResult.rowCount > 0) {
      await pool.query('INSERT INTO borrow_history (book_id, user_id) VALUES ($1, $2)', [bookId, userId]);
    }
    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

// User Return Book
app.post('/api/return', async (req, res) => {
  const { bookId, userId } = req.body;
  try {
    await pool.query('BEGIN');
    const updateResult = await pool.query('UPDATE books SET status = $1, borrowed_by = NULL WHERE id = $2 AND borrowed_by = $3', ['Available', bookId, userId]);
    if (updateResult.rowCount > 0) {
      await pool.query('UPDATE borrow_history SET returned_at = CURRENT_TIMESTAMP WHERE book_id = $1 AND user_id = $2 AND returned_at IS NULL', [bookId, userId]);
    }
    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
