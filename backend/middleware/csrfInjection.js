/**
   * CSRF Injection Middleware
   * Injects CSRF tokens into HTML responses
   */
  const csrfInjection = (req, res, next) => {
    // Store original res.send
    const originalSend = res.send;

    // Override res.send for HTML responses
    res.send = function(body) {
      // Only process HTML responses
      if (typeof body === 'string' && body.includes('<!DOCTYPE html>')) {
        // Look for </head> tag
        const csrfToken = req.cookies.csrf_token || '';

        // Add meta tag with CSRF token
        if (csrfToken && body.includes('</head>')) {
          body = body.replace(
            '</head>',
            `<meta name="csrf-token" content="${csrfToken}">
  </head>`
          );
        }

        // Add token to forms
        if (csrfToken && body.includes('<form')) {
          // Careful with the regex here - this is likely where your error is
          body = body.replace(
            /<form([^>]*)>/g,  // Fixed regex that should work
            (match) => {
              return match.replace('>', `>
  <input type="hidden" name="csrf_token" value="${csrfToken}">`);
            }
          );
        }
      }

      // Call original send with modified or original body
      return originalSend.call(this, body);
    };

    next();
  };

  module.exports = csrfInjection;