/**
 * Admin Dashboard JavaScript
 * Handles all client-side functionality for the admin dashboard
 */

// Store the JWT token from localStorage
let authToken = localStorage.getItem('authToken');
let currentUser = {};

// DOM Elements
const adminUsernameElement = document.getElementById('adminUsername');
const totalUsersElement = document.getElementById('totalUsers');
const adminUsersElement = document.getElementById('adminUsers');
const blogPostsElement = document.getElementById('blogPosts');
const newUsersElement = document.getElementById('newUsers');
const userTableBodyElement = document.getElementById('userTableBody');
const whitelistTableBodyElement = document.getElementById('whitelistTableBody');
const addWhitelistBtn = document.getElementById('addWhitelistBtn');
const whitelistModal = document.getElementById('whitelistModal');
const whitelistForm = document.getElementById('whitelistForm');
const closeModalBtn = document.querySelector('.close-btn');
const cancelWhitelistBtn = document.getElementById('cancelWhitelistBtn');
const logoutBtn = document.getElementById('logoutBtn');
const viewModeBtn = document.getElementById('viewModeBtn');
const csrfTokenField = document.getElementById('csrf_token');

// Check if user is authenticated
function checkAuth() {
  if (!authToken) {
    // Redirect to login page if no token is found
    window.location.href = '/itslogin.html';
    return false;
  }

  // Parse the JWT token to get user info
  try {
    const tokenParts = authToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    currentUser = payload;

    // Check if token is expired
    if (payload.exp * 1000 < Date.now()) {
      logout('Your session has expired. Please login again.');
      return false;
    }

    // Check if user has admin role
    if (payload.role !== 'admin' && payload.role !== 'superadmin') {
      logout('You do not have permission to access this page.');
      return false;
    }

    // Update username display
    adminUsernameElement.textContent = payload.username;

    return true;
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    logout('Authentication error. Please login again.');
    return false;
  }
}

// Fetch CSRF token from cookie
function getCSRFToken() {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token') {
      return value;
    }
  }
  return '';
}

// Logout function
function logout(message) {
  localStorage.removeItem('authToken');
  if (message) {
    localStorage.setItem('loginMessage', message);
  }
  window.location.href = '/itslogin.html';
}

// Fetch dashboard data
async function fetchDashboardData() {
  try {
    const response = await fetch('/api/admin/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    const data = await response.json();

    // Update stats
    totalUsersElement.textContent = data.stats.totalUsers || '0';
    adminUsersElement.textContent = data.stats.adminUsers || '0';
    blogPostsElement.textContent = data.stats.blogPosts || '0';
    newUsersElement.textContent = data.stats.newUsers || '0';

    // Update user table
    renderUserTable(data.users || []);

    // Update whitelist table
    renderWhitelistTable(data.whitelist || []);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    showNotification('Failed to load dashboard data. Please try again.', 'error');
  }
}

// Render user table
function renderUserTable(users) {
  if (!users.length) {
    userTableBodyElement.innerHTML = '<tr><td colspan="5" style="text-align: center;">No users found</td></tr>';
    return;
  }

  userTableBodyElement.innerHTML = users.map(user => `
    <tr>
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td><span class="user-role ${user.role}">${user.role}</span></td>
      <td>${new Date(user.created_at).toLocaleDateString()}</td>
      <td>
        <button class="action-btn" onclick="viewUser('${user.username}')">View</button>
        ${currentUser.role === 'superadmin' ?
          `<button class="action-btn danger" onclick="deleteUser('${user.username}')">Delete</button>` : ''}
      </td>
    </tr>
  `).join('');
}

// Render whitelist table
function renderWhitelistTable(whitelist) {
  if (!whitelist.length) {
    whitelistTableBodyElement.innerHTML = '<tr><td colspan="4" style="text-align: center;">No entries in whitelist</td></tr>';
    return;
  }

  whitelistTableBodyElement.innerHTML = whitelist.map(entry => `
    <tr>
      <td>${entry.email}</td>
      <td>${entry.approved_by}</td>
      <td>${new Date(entry.created_at).toLocaleDateString()}</td>
      <td>
        <button class="action-btn danger" onclick="removeFromWhitelist(${entry.id})">Remove</button>
      </td>
    </tr>
  `).join('');
}

// Mock data for initial testing
function loadMockData() {
  const mockUsers = [
    { username: 'user1', email: 'user1@example.com', role: 'user', created_at: '2025-05-01T00:00:00.000Z' },
    { username: 'admin1', email: 'admin1@example.com', role: 'admin', created_at: '2025-05-02T00:00:00.000Z' },
    { username: 'superadmin', email: 'super@example.com', role: 'superadmin', created_at: '2025-05-03T00:00:00.000Z' }
  ];

  const mockWhitelist = [
    { id: 1, email: 'admin@example.com', approved_by: 'system', created_at: '2025-05-01T00:00:00.000Z' },
    { id: 2, email: 'admin2@example.com', approved_by: 'superadmin', created_at: '2025-05-04T00:00:00.000Z' }
  ];

  // Update stats
  totalUsersElement.textContent = '15';
  adminUsersElement.textContent = '3';
  blogPostsElement.textContent = '27';
  newUsersElement.textContent = '5';

  // Update tables
  renderUserTable(mockUsers);
  renderWhitelistTable(mockWhitelist);
}

// Add to whitelist function
async function addToWhitelist(email) {
  try {
    const csrfToken = getCSRFToken();

    const response = await fetch('/api/admin/whitelist', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        csrf_token: csrfToken
      })
    });

    if (!response.ok) {
      throw new Error('Failed to add email to whitelist');
    }

    showNotification('Email added to whitelist successfully.', 'success');

    // Refresh dashboard data
    fetchDashboardData();

  } catch (error) {
    console.error('Error adding to whitelist:', error);
    showNotification('Failed to add to whitelist. Please try again.', 'error');
  }
}

// Remove from whitelist function
async function removeFromWhitelist(id) {
  if (!confirm('Are you sure you want to remove this email from the whitelist?')) {
    return;
  }

  try {
    const csrfToken = getCSRFToken();

    const response = await fetch(`/api/admin/whitelist/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        csrf_token: csrfToken
      })
    });

    if (!response.ok) {
      throw new Error('Failed to remove email from whitelist');
    }

    showNotification('Email removed from whitelist successfully.', 'success');

    // Refresh dashboard data
    fetchDashboardData();

  } catch (error) {
    console.error('Error removing from whitelist:', error);
    showNotification('Failed to remove from whitelist. Please try again.', 'error');
  }
}

// View user details function
function viewUser(username) {
  // This would navigate to a user detail page or show a modal with user details
  alert(`View details for ${username} (TO BE IMPLEMENTED)`);
}

// Delete user function (superadmin only)
async function deleteUser(username) {
  if (!confirm(`Are you sure you want to delete user ${username}?`)) {
    return;
  }

  try {
    const csrfToken = getCSRFToken();

    const response = await fetch(`/api/admin/users/${username}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        csrf_token: csrfToken
      })
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }

    showNotification(`User ${username} deleted successfully.`, 'success');

    // Refresh dashboard data
    fetchDashboardData();

  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification('Failed to delete user. Please try again.', 'error');
  }
}

// Toggle dark mode
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  // Save preference to localStorage
  const isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
}

// Show notification
function showNotification(message, type = 'success') {
  // For simplicity, let's use alert, but in a real app this would be a toast or notification component
  alert(`${type.toUpperCase()}: ${message}`);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  if (!checkAuth()) {
    return;
  }

  // Load dashboard data
  // fetchDashboardData(); // Use this in production
  loadMockData(); // Use mock data for testing

  // Set up event handlers
  addWhitelistBtn.addEventListener('click', () => {
    csrfTokenField.value = getCSRFToken();
    whitelistModal.style.display = 'flex';
  });

  closeModalBtn.addEventListener('click', () => {
    whitelistModal.style.display = 'none';
  });

  cancelWhitelistBtn.addEventListener('click', () => {
    whitelistModal.style.display = 'none';
  });

  whitelistForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('whitelistEmail').value;
    addToWhitelist(email);
    whitelistModal.style.display = 'none';
    whitelistForm.reset();
  });

  logoutBtn.addEventListener('click', () => {
    logout();
  });

  viewModeBtn.addEventListener('click', toggleDarkMode);

  // Close modal if clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === whitelistModal) {
      whitelistModal.style.display = 'none';
    }
  });

  // Apply dark mode if previously set
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
  }
});