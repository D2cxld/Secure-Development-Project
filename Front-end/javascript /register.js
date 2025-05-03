document.getElementById('registerForm').addEventListener('submit', function (e) {
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('passwordError');
  
    if (password !== confirm) {
      e.preventDefault(); // Stop form submission
      errorDiv.textContent = 'Passwords do not match';
    } else {
      errorDiv.textContent = '';
    }
});

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
            statusDiv.textContent = 'Username is available!';
        } else {
            statusDiv.style.color = 'red';
            statusDiv.textContent = 'Username is already taken';
        }
    } catch (error) {
        console.error('Error checking username:', error);
        statusDiv.style.color = 'red';
        statusDiv.textContent = 'Error checking username';
    }
});

module.exports = router;
