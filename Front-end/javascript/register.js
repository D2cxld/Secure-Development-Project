// Password match check
document.getElementById('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault(); // Always prevent default form submission
  
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('passwordError');
  
    // Password confirmation check
    if (password !== confirm) {
      errorDiv.textContent = '❌ Passwords do not match';
      return;
    }
  
    // Clear any old errors
    errorDiv.textContent = '';
  
    // Send to backend for NIST-style validation
    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
  
      const result = await response.text();
  
      alert(result);
  
      if (response.ok) { 
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('⚠️ Error submitting registration form');
    }
  });
  
  // Username availability checker (unchanged)
  document.getElementById('username').addEventListener('blur', async function () {
    const username = this.value;
    const statusDiv = document.getElementById('usernameStatus');
  
    if (username.length === 0) {
      statusDiv.textContent = '';
      return;
    }
  
    try {
      const response = await fetch(`/register/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
  
      if (data.available) {
        statusDiv.style.color = 'green';
        statusDiv.textContent = '✅ Username is available!';
      } else {
        statusDiv.style.color = 'red';
        statusDiv.textContent = '❌ Username is already taken';
      }
    } catch (error) {
      console.error('Error checking username:', error);
      statusDiv.style.color = 'red';
      statusDiv.textContent = '⚠️ Error checking username';
    }
  });
  