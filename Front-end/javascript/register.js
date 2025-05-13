document.addEventListener('DOMContentLoaded', () => {
    console.log("register.js loaded");

    // Password match + email check
    document.getElementById('registerForm').addEventListener('submit', async function (e) {
      e.preventDefault();

      const first_name = document.getElementById('firstName').value.trim();
      const surname = document.getElementById('surname').value.trim();
      const email = document.getElementById('email').value.trim();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword').value;

      const passwordError = document.getElementById('passwordError');
      const emailError = document.getElementById('emailStatus');
      const formError = document.getElementById('formError');

      // Clear errors
      passwordError.textContent = '';
      emailError.textContent = '';
      formError.textContent = '';

      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailError.textContent = '⚠️ Invalid email format';
        return;
      }

      // Password confirmation check
      if (password !== confirm) {
        passwordError.textContent = '⚠️ Passwords do not match';
        return;
      }

      // Basic validation
      if (!first_name || !surname || !email || !username || !password) {
        formError.textContent = '⚠️ All fields are required';
        return;
      }

      // Password length check
      if (password.length < 8 || password.length > 64) {
        passwordError.textContent = '⚠️ Password must be 8-64 characters';
        return;
      }

      console.log("Submitting form with:", { first_name, surname, email, username });

      try {
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering...';

        console.log("Sending registration data to server...");

        const response = await fetch('/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ first_name, surname, email, username, password })
        });

        console.log("Server response status:", response.status);

        let result;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            result = await response.json();
            console.log("JSON response received:", result);
          } else {
            // Handle case where response is not JSON
            const textResult = await response.text();
            console.log("Text response received:", textResult);
            result = { message: textResult };
          }
        } catch (jsonError) {
          console.error("Error parsing response:", jsonError);
          const textResult = await response.text();
          console.log("Fallback text response:", textResult);
          result = { message: textResult || '⚠️ Could not parse server response' };
        }

        if (!response.ok) {
          formError.textContent = result.message || '⚠️ Registration failed.';
          console.error('Registration failed:', result);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Register';
          return;
        }

        console.log("Registration successful:", result);

        // Store user information in sessionStorage for 2FA
        if (result.username) {
          sessionStorage.setItem('username', result.username);
        }

        if (email) {
          sessionStorage.setItem('email', email);
        }

        if (result.needs2FA) {
          sessionStorage.setItem('needsVerification', 'true');
        }

        // Display success message
        formError.style.color = 'green';
        formError.textContent = result.message || '! Registration successful';

        // Handle redirection
        if (result.isAdmin && result.needs2FA) {
          setTimeout(() => window.location.href = '/2fa.html', 1500);
        } else {
          setTimeout(() => window.location.href = '/blog.html', 1500);
        }
      } catch (error) {
        console.error('Error submitting registration:', error);
        formError.textContent = '⚠️ Error submitting registration form';

        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
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

      if (username.length < 3) {
        usernameStatus.style.color = 'red';
        usernameStatus.textContent = '⚠️ Username must be at least 3 characters';
        return;
      }

      usernameStatus.textContent = '⏳ Checking...';

      try {
        const res = await fetch(`/register/check-username?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (data.available) {
          usernameStatus.style.color = 'green';
          usernameStatus.textContent = '! Username is available!';
        } else {
          usernameStatus.style.color = 'red';
          usernameStatus.textContent = '⚠️ Username already exists';
        }
      } catch (err) {
        console.error('Username check error:', err);
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

      // Basic email format check before making API call
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailStatus.style.color = 'red';
        emailStatus.textContent = '⚠️ Invalid email format';
        return;
      }

      emailStatus.textContent = '⏳ Checking...';

      try {
        const res = await fetch(`/register/check-email?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.available) {
          emailStatus.style.color = 'green';
          emailStatus.textContent = '! Email is available';
        } else {
          emailStatus.style.color = 'red';
          emailStatus.textContent = '⚠️ Email already registered';
        }
      } catch (err) {
        console.error('Email check error:', err);
        emailStatus.style.color = 'red';
        emailStatus.textContent = '⚠️ Error checking email';
      }
    });

    // Password strength meter
    const passwordInput = document.getElementById('password');
    const strengthMeter = document.getElementById('passwordStrength');

    if (passwordInput && strengthMeter) {
      passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strength = 0;
        let feedback = '';

        // Length check
        if (password.length >= 8) {
          strength += 1;
        }

        // Complexity checks
        if (/[A-Z]/.test(password)) strength += 1; // Has uppercase
        if (/[a-z]/.test(password)) strength += 1; // Has lowercase
        if (/[0-9]/.test(password)) strength += 1; // Has number
        if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Has special char

        // Update UI based on strength
        if (password.length === 0) {
          strengthMeter.textContent = '';
        } else if (strength < 2) {
          strengthMeter.style.color = 'red';
          strengthMeter.textContent = 'Weak';
        } else if (strength < 4) {
          strengthMeter.style.color = 'orange';
          strengthMeter.textContent = 'Medium';
        } else {
          strengthMeter.style.color = 'green';
          strengthMeter.textContent = 'Strong';
        }
      });
    }
  });