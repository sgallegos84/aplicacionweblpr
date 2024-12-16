require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const dbConfig = require('./dbConfig');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para servir archivos estáticos (frontend)
app.use(express.static('../frontend'));

// Conexión a la base de datos
sql.connect(dbConfig)
  .then(() => console.log('Conexión exitosa a la base de datos'))
  .catch((err) => {
    console.error('Error al conectar la base de datos:', err);
    process.exit(1); // Detener si no hay conexión
  });

// Ruta para puntos de interés (POIs)
app.get('/api/pois', async (req, res) => {
  try {
    const result = await sql.query('SELECT Name, Northing, Easting FROM LPR_City');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los puntos de interés.' });
  }
});

// Ruta para buscar placas
app.get('/api/searchPlate', async (req, res) => {
  const { plateNumber, startDate, endDate } = req.query;
  try {
    const query = `
      SELECT PlateNumber, Name, Northing, Easting, Time
      FROM detections D
      LEFT JOIN LPR_City N
        ON D.SensorId = N.SensorId
      WHERE PlateNumber = @plateNumber AND Time BETWEEN @startDate AND @endDate
      ORDER BY Time ASC;
    `;
    const request = new sql.Request();
    request.input('plateNumber', sql.VarChar, plateNumber);
    request.input('startDate', sql.DateTime2, startDate);
    request.input('endDate', sql.DateTime2, endDate);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No se encontraron registros para la placa especificada.' });
    }

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar la placa.' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
