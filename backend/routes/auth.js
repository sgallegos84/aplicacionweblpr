const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Ruta para registro de usuario
router.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Crear nuevo usuario
    await User.create(username, password, role);
    res.status(201).send('Usuario creado con éxito');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al crear el usuario');
  }
});

// Ruta para login de usuario
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Buscar usuario por username
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).send('Usuario no encontrado');
    }

    // Comparar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Contraseña incorrecta');
    }

    // Crear el token JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al iniciar sesión');
  }
});

module.exports = router;
