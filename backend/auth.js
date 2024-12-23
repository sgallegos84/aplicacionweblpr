const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sql = require('mssql');
const dbConfig = require('./dbConfig');

const JWT_SECRET = process.env.JWT_SECRET;

async function loginUser(req, res) {
  const { username, password } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('username', sql.NVarChar, username)  // Ajuste para el tipo NVARCHAR
      .query('SELECT * FROM PSIM_users WHERE username = @username');

    const user = result.recordset[0];

    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

module.exports = { loginUser };
