const bcrypt = require('bcryptjs');
const sql = require('mssql');
const dbConfig = require('./dbConfig');

// Crear un nuevo usuario
async function createUser(req, res) {
  const { username, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('username', sql.NVarChar, username)  // Ajuste para el tipo NVARCHAR
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, role)
      .query('INSERT INTO PSIM_users (username, password, role) VALUES (@username, @password, @role)');

    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
}

// Obtener todos los usuarios
async function getUsers(req, res) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT id, username, role, created_at, updated_at FROM PSIM_users');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

module.exports = { createUser, getUsers };
