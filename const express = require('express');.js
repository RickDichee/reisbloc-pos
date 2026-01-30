const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

// Genera tus propios hashes de PIN con bcrypt.hashSync('1234', 10)
const usuarios = [
  // PIN: 1234
  { id: 1, nombre: 'Admin', pin_hash: '$2a$10$wQwQwQwQwQwQwQwQwQwQwuQwQwQwQwQwQwQwQwQwQwQwQwQwQwQw', rol: 'admin', activo: true },
  // PIN: 5678
  { id: 2, nombre: 'Socio', pin_hash: '$2a$10$eW5nQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQwQw', rol: 'socio', activo: true }
];

app.post('/api/login-pin', async (req, res) => {
  const { pin } = req.body;
  const usuario = usuarios.find(u => u.activo && bcrypt.compareSync(pin, u.pin_hash));
  if (usuario) {
    res.json({ ok: true, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } });
  } else {
    res.status(401).json({ ok: false, error: 'PIN incorrecto' });
  }
});

app.listen(3001, () => console.log('Backend corriendo en http://localhost:3001'));