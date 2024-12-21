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

  // Función para mostrar los resultados en una tabla
  const displayResultsInTable = (data) => {
    const resultsTable = document.getElementById('resultsTable');
    resultsTable.innerHTML = ''; // Limpiar tabla antes de mostrar nuevos resultados

    if (data.length === 0) {
      resultsTable.innerHTML = '<p>No se encontraron resultados.</p>';
      return;
    }

    // Crear encabezados de la tabla
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const headers = ['ID', 'NOMBRE LPR', 'Confianza', 'Pais', 'Fecha', 'Placa', 'Marca', 'Color', 'Modelo', 'Tipo', 'Latitud', 'Longitud', 'GUID', 'SlaveId'];
    const headerRow = document.createElement('tr');
    headers.forEach((header) => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // Crear filas con los resultados
    data.forEach((result) => {
      const row = document.createElement('tr');

      Object.keys(result).forEach((key) => {
        const td = document.createElement('td');
        td.textContent = result[key];
        row.appendChild(td);
      });

      tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    resultsTable.appendChild(table);
  };

  // Manejo del formulario de búsqueda
  document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const plateNumber = document.getElementById('plateNumber').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    // Validación de fechas
    if (!startDate || !endDate) {
      alert('Las fechas de inicio y fin son obligatorias.');
      return;
    }

    fetch(`/api/searchPlate?plateNumber=${encodeURIComponent(plateNumber)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error('Error:', data.error);
          alert(data.error); // Mostrar el error en el frontend
        } else {
          console.log('Resultados:', data);
          displayResultsInTable(data); // Lógica para mostrar los resultados en la tabla
          
          // Mostrar trayectorias en el mapa
          showTrajectoryOnMap(data);
        }
      })
      .catch((error) => {
        console.error('Error al buscar:', error);
        alert('Ocurrió un error al buscar los registros.');
      });
  });

  // Función para mostrar trayectorias en el mapa
  const showTrajectoryOnMap = (data) => {
    // Limpiar las trayectorias previas
    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Agrupar las trayectorias por ID de placa
    const platePaths = {};

    data.forEach((record) => {
      const { PlateNumber, Latitude, Longitude } = record;

      if (Latitude && Longitude) {
        if (!platePaths[PlateNumber]) {
          platePaths[PlateNumber] = [];
        }
        platePaths[PlateNumber].push([Latitude, Longitude]);
      }
    });

    // Dibujar trayectorias en el mapa
    Object.keys(platePaths).forEach((plateNumber) => {
      const path = platePaths[plateNumber];
      if (path.length > 1) {
        L.polyline(path, { color: 'blue', weight: 3 }).addTo(map)
          .bindPopup(`<strong>Placa: ${plateNumber}</strong>`);
      }
    });
  };
});
