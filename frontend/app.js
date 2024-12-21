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
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model').value;
    const type = document.getElementById('type').value;
    const color = document.getElementById('color').value;
    const name = document.getElementById('name').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    fetch(
      `/api/searchPlate?plateNumber=${encodeURIComponent(plateNumber)}&brand=${encodeURIComponent(
        brand
      )}&model=${encodeURIComponent(model)}&type=${encodeURIComponent(
        type
      )}&color=${encodeURIComponent(color)}&name=${encodeURIComponent(
        name
      )}&startDate=${startDate}&endDate=${endDate}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log('Resultados:', data);
        // Aquí puedes agregar lógica para procesar los resultados
      })
      .catch((error) => console.error('Error al buscar:', error));
  });
});
