document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
  
    const data = await response.json();
  
    if (data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = 'profile.html';  // Redirigir al perfil
    } else {
      alert('Error de login: ' + data.error);
    }
  });
  