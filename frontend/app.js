document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([21.88234, -102.28259], 13);

  // Cargar capa base
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Función para cargar puntos de interés
  const loadPOIs = () => {
    fetch('/api/pois')
      .then((res) => res.json())
      .then((pois) => {
        pois.forEach((poi) => {
          const { NAME, LATITUDE, LONGITUDE } = poi;

          if (LATITUDE && LONGITUDE) {
            L.marker([LATITUDE, LONGITUDE])
              .addTo(map)
              .bindPopup(`<strong>${NAME}</strong>`);
          }
        });
      })
      .catch((error) => console.error('Error al cargar los puntos de interés:', error));
  };

  // Cargar puntos de interés al inicializar
  loadPOIs();

  // Manejo del formulario de búsqueda
  document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const plateNumber = document.getElementById('plateNumber').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    fetch(
      `/api/searchPlate?plateNumber=${encodeURIComponent(plateNumber)}&startDate=${startDate}&endDate=${endDate}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log('Resultados:', data);
        if (Array.isArray(data)) {
          displayResultsInTable(data); // Muestra los resultados en la tabla
        } else {
          console.error('Error en los datos de respuesta:', data);
        }
      })
      .catch((error) => console.error('Error al buscar:', error));
  });

  // Función para mostrar los resultados en la tabla
  function displayResultsInTable(data) {
    const resultsTable = document.getElementById('resultsTable');
    
    // Crear la tabla HTML
    let tableHtml = `
    <table>
      <thead>
        <tr>
          
          <th>PMI</th>
          <th>Placa</th>
          <th>Fotografia</th>
          <th>Panoramica</th>
          <th>Marca</th>
          <th>Modelo</th>
          <th>Color</th>
          <th>Tipo</th>
          <th>Fecha y Hora</th>
          <th>Latitud</th>
          <th>Longitud</th>
          
        </tr>
      </thead>
      <tbody>`;

    // Agregar filas de resultados a la tabla
    data.forEach(result => {
      tableHtml += `<tr>
                      
                      <td>${result.PMI}</td>
                      <td>${result.PlateNumber}</td>
                      <td><img src="http://${result.SlaveId}:10001/lprserver/GetImage/Plate_numbers/${result.PlateGuid}" alt="${result.PlateNumber}" /></td>
                      <td><img src="http://${result.SlaveId}:10001/lprserver/GetImage/Frames/${result.PlateGuid}" alt="${result.PlateNumber}" width="100" height="100"/></td>
                      <td>${result.vehicle_brand}</td>
                      <td>${result.vehicle_model}</td>
                      <td>${result.vehicle_color}</td>
                      <td>${result.vehicle_type}</td>
                      <td>${result.datetime}</td>
                      <td>${result.Latitude}</td>
                      <td>${result.Longitude}</td>
                      
                    </tr>`;
    });

    tableHtml += '</tbody></table>';

    // Mostrar la tabla en el contenedor
    resultsTable.innerHTML = tableHtml;
  }
});
