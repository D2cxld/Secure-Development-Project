// Password match check
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Always prevent default form submission

  // Gather all field values
  const first_name = document.getElementById('firstName').value.trim();
  const surname = document.getElementById('surname').value.trim();
  const email = document.getElementById('email').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirmPassword').value;
  const errorDiv = document.getElementById('passwordError');

  // Simple client-side validation
  if (!first_name || !surname || !email || !username || !password || !confirm) {
    alert('❌ All fields are required.');
    return;
  }

  // Password match check
  if (password !== confirm) {
    errorDiv.textContent = '❌ Passwords do not match';
    return;
  }

  // Clear any old errors
  errorDiv.textContent = '';

  // Send to backend for full validation
  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ first_name, surname, email, username, password })
    });

    const result = await response.text();
    alert(result);

    if (response.ok) {
      // Optionally redirect or reset form here
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
