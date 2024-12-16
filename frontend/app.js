// Configuración inicial del mapa
const map = L.map('map').setView([21.88234, -102.28259], 13);

// Agregar capa base
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

// Cargar puntos de interés
fetch('/api/pois')
  .then((res) => res.json())
  .then((pois) => {
    pois.forEach((poi) => {
      L.marker([poi.Northing, poi.Easting]).addTo(map).bindPopup(`<b>${poi.Name}</b>`);
    });
  });

// Manejo del formulario
document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const plateNumber = document.getElementById('plateNumber').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  fetch(`/api/searchPlate?plateNumber=${encodeURIComponent(plateNumber)}&startDate=${startDate}&endDate=${endDate}`)
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data)) {
        throw new TypeError('La respuesta no es un array');
      }

      // Limpiar resultados anteriores
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) map.removeLayer(layer);
      });

      // Mostrar resultados en el mapa
      const coordinates = [];
      data.forEach((record) => {
        coordinates.push([record.Northing, record.Easting]);
        L.marker([record.Northing, record.Easting]).addTo(map).bindPopup(
          `<b>Placa: ${record.PlateNumber}</b><br>
           <b>PMI: ${record.Name}</b><br>
           <b>Fecha y hora: ${record.Time}</b>`
        );
      });

      // Dibujar línea de la trayectoria
      if (coordinates.length > 1) {
        L.polyline(coordinates, { color: 'red' }).addTo(map);
      }

      // Crear tabla de resultados
      const resultsTable = document.getElementById('resultsTable');
      resultsTable.innerHTML = generateTableHTML(data);
    })
    .catch((error) => {
      console.error('Error al procesar los datos:', error);
    });
});

// Generar HTML para la tabla de resultados
function generateTableHTML(data) {
  let html = '<table><thead><tr>';
  html += '<th>Placa</th><th>PMI</th><th>Fecha y hora</th><th>Northing</th><th>Easting</th>';
  html += '</tr></thead><tbody>';
  data.forEach(record => {
    html += `<tr><td>${record.PlateNumber}</td><td>${record.Name}</td><td>${record.Time}</td><td>${record.Northing}</td><td>${record.Easting}</td></tr>`;
  });
  html += '</tbody></table>';
  return html;
}

// Exportar resultados a CSV
document.getElementById('exportCSV').addEventListener('click', () => {
  const resultsTable = document.getElementById('resultsTable');
  const rows = resultsTable.querySelectorAll('table tr');
  let csvContent = 'data:text/csv;charset=utf-8,';

  rows.forEach(row => {
    const cols = row.querySelectorAll('td, th');
    const data = Array.from(cols).map(col => col.textContent).join(',');
    csvContent += data + '\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'results.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
