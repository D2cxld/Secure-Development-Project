// Password match + email check

document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const first_name = document.getElementById('firstname').value.trim();
  const surname = document.getElementById('surname').value.trim();
  const email = document.getElementById('email').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirmPassword').value;

  const passwordError = document.getElementById('passwordError');
  const emailError = document.getElementById('emailStatus');

  // Clear errors
  passwordError.textContent = '';
  emailError.textContent = '';

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    emailError.textContent = '❌ Invalid email format';
    return;
  }

  // Password confirmation check
  if (password !== confirm) {
    passwordError.textContent = '❌ Passwords do not match';
    return;
  }

  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ first_name, surname, email, username, password })
    });

    const result = await response.json();

    alert(result.message);

    if (response.ok) {
      if (result.role === 'admin') {
        window.location.href = '/2fa.html';
      } else {
        window.location.href = '/blog.html';
      }

    }
  } catch (error) {
    console.error('Error submitting registration:', error);
    alert('⚠️ Error submitting registration form');
  }
});

// Username availability checker

const usernameInput = document.getElementById('username');
const usernameStatus = document.getElementById('usernameStatus');

usernameInput.addEventListener('blur', async function () {
  const username = this.value.trim();
  if (username.length === 0) {
    usernameStatus.textContent = '';
    return;
  }
  try {
    const res = await fetch(`/register/check-username?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    if (data.available) {
      usernameStatus.style.color = 'green';
      usernameStatus.textContent = '✅ Username is available!';
    } else {
      usernameStatus.style.color = 'red';
      usernameStatus.textContent = '❌ Username already exists';
    }
  } catch (err) {
    usernameStatus.style.color = 'red';
    usernameStatus.textContent = '⚠️ Error checking username';
  }
});

// Email availability checker
const emailInput = document.getElementById('email');
const emailStatus = document.getElementById('emailStatus');

emailInput.addEventListener('blur', async function () {
  const email = this.value.trim();
  if (email.length === 0) {
    emailStatus.textContent = '';
    return;
  }
  try {
    const res = await fetch(`/register/check-email?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (data.available) {
      emailStatus.style.color = 'green';
      emailStatus.textContent = '✅ Email is available';
    } else {
      emailStatus.style.color = 'red';
      emailStatus.textContent = '❌ Email already registered';
    }
  } catch (err) {
    emailStatus.style.color = 'red';
    emailStatus.textContent = '⚠️ Error checking email';
  }
});
