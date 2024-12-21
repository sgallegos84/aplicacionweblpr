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
    const result = await sql.query('SELECT ID, NAME, LONGITUDE, LATITUDE FROM LPR_PSIM');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los puntos de interés.' });
  }
});

// Ruta para buscar placas
app.get('/api/searchPlate', async (req, res) => {
  const { plateNumber, brand, model, type, color, name, startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Las fechas de inicio y fin son obligatorias.' });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end - start) / (1000 * 60 * 60 * 24);

  if (diff > 7) {
    return res.status(400).json({ error: 'El periodo de búsqueda no debe exceder 7 días.' });
  }

  try {
    const query = `
      SELECT D.[cam_id] AS ID, N.NAME AS PMI, D.[confidence], D.[country_code], 
             D.[datetime], D.[plate] AS PlateNumber, D.[vehicle_brand], 
             D.[vehicle_color], D.[vehicle_model], D.[vehicle_type], 
             N.latitude AS Latitude, N.longitude AS Longitude
      FROM [dbo].[DetectionPSIM] D
      LEFT JOIN [dbo].[LPR_PSIM] N ON D.cam_id = N.Id
      WHERE (@plateNumber IS NULL OR D.plate = @plateNumber)
        AND D.[datetime] BETWEEN @startDate AND @endDate
      ORDER BY D.[datetime] ASC;
    `;

    const request = new sql.Request();
    request.input('plateNumber', sql.VarChar, plateNumber || null);
    request.input('startDate', sql.DateTime2, startDate);
    request.input('endDate', sql.DateTime2, endDate);

    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No se encontraron registros.' });
    }

    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar los registros.' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});