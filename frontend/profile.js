document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      window.location.href = 'login.html'; // Si no hay token, redirigir al login
      return;
    }
  
    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  
    const data = await response.json();
    document.getElementById('userInfo').innerText = JSON.stringify(data);
  });
  