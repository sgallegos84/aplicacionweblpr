document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([21.88234, -102.28259], 13);

  // Cargar capa base
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  // Variable para almacenar las capas de la trayectoria
  let trajectoryLayers = [];

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
          drawTrajectory(data); // Dibuja las trayectorias
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
          <th>Fotografía</th>
          <th>Panorámica</th>
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
                      <td><img class="thumbnail" src="http://${result.SlaveId}:10001/lprserver/GetImage/Plate_numbers/${result.PlateGuid}" alt="${result.PlateNumber}" /></td>
                      <td><img class="thumbnail" src="http://${result.SlaveId}:10001/lprserver/GetImage/Frames/${result.PlateGuid}" alt="${result.PlateNumber}" width="100" height="100" onclick="openModal('${result.SlaveId}', '${result.PlateGuid}')"/></td>
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

  // Función para abrir el modal
  window.openModal = (slaveId, plateGuid) => {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');

    // Establecer el src de la imagen grande
    modalImg.src = `http://${slaveId}:10001/lprserver/GetImage/Frames/${plateGuid}`;
    modal.style.display = 'block';  // Mostrar el modal
  };

  // Cerrar el modal cuando se hace clic en el área fuera de la imagen
  window.onclick = (event) => {
    const modal = document.getElementById('imageModal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };

  // Función para dibujar la trayectoria y limpiar los puntos de interés
  function drawTrajectory(data) {
    // Agrupar los resultados por PlateNumber
    const groupedData = {};
    data.forEach(result => {
      if (!groupedData[result.PlateNumber]) {
        groupedData[result.PlateNumber] = [];
      }
      groupedData[result.PlateNumber].push([result.Latitude, result.Longitude]);
    });

    // Limpiar las capas anteriores (puntos de interés y líneas)
    map.eachLayer(function (layer) {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Dibujar la trayectoria para cada placa
    for (const plateNumber in groupedData) {
      const points = groupedData[plateNumber];

      // Dibujar la línea que conecta los puntos
      const polyline = L.polyline(points, { color: 'red', weight: 3, opacity: 0.7 }).addTo(map);
      trajectoryLayers.push(polyline);  // Almacenar la polilínea para poder limpiarla más tarde

      // Agregar los puntos de interés solo dentro de la línea (puntos de la trayectoria)
      points.forEach((point) => {
        L.marker(point).addTo(map);
      });
    }
  }

  // Evento para el botón "Mostrar Puntos de Interés"
  document.getElementById('loadPOIsButton').addEventListener('click', () => {
    // Limpiar las trayectorias antes de cargar los puntos de interés
    trajectoryLayers.forEach(layer => {
      map.removeLayer(layer);
    });
    trajectoryLayers = []; // Limpiar el arreglo que almacena las capas de trayectoria

    loadPOIs();  // Llamamos a la función para cargar nuevamente los puntos de interés
  });
});