document.addEventListener('DOMContentLoaded', async () => {
  console.log('Blog page loaded');
  
  // Get authentication elements
  const adminActions = document.getElementById('adminActions');
  const superAdminActions = document.getElementById('superAdminActions');
  const userWelcome = document.getElementById('userWelcome');
  const logoutBtn = document.getElementById('logoutBtn');
  
  // Check for JWT token
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  
  if (!token) {
    // No token found, redirect to login
    console.log('No authentication token found, redirecting to login');
    window.location.href = '/itslogin.html';
    return;
  }
  
  try {
    // Verify token and get user info
    const response = await fetch('/api/user/verify', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Token invalid or expired
      console.error('Invalid or expired token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      window.location.href = '/itslogin.html';
      return;
    }
    
    const userData = await response.json();
    console.log('User authenticated:', userData);
    
    // Update UI based on user role
    if (userWelcome) {
      userWelcome.textContent = `Welcome, ${userData.username}!`;
    }
    
    // Show/hide admin controls based on role
    if (userData.role === 'admin' || userData.role === 'superadmin') {
      if (adminActions) {
        adminActions.style.display = 'block';
      }
    }
    
    // Show/hide superadmin controls
    if (userData.role === 'superadmin') {
      if (superAdminActions) {
        superAdminActions.style.display = 'block';
      }
    }
    
    // Setup logout functionality
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        // Clear tokens
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        
        // Redirect to login
        window.location.href = '/itslogin.html';
      });
    }
  } catch (error) {
    console.error('Error verifying authentication:', error);
    // Handle error - could redirect to error page or login
  }
  
  // For development testing only - remove this in production
  window.showAdminPanel = (show = true) => {
    if (adminActions) {
      adminActions.style.display = show ? 'block' : 'none';
    }
    console.log('Admin panel visibility manually set to:', show);
  };
});