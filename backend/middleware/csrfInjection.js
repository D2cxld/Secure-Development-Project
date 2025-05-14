File: /backend/middleware/csrfInjection.js
  /**
   * CSRF Token Injection Middleware
   *
   * This middleware injects CSRF tokens into HTML forms when serving HTML content.
   * It looks for </form> tags and injects a hidden input field with the CSRF token.
   */

  module.exports = function(req, res, next) {
    // Store the original send function
    const originalSend = res.send;

    // Override the send function
    res.send = function(body) {
      // Only process HTML responses
      if (typeof body === 'string' &&
          res.getHeader('content-type')?.includes('text/html') &&
          res.locals.csrfToken) {

        // Inject CSRF token into all forms
        body = body.replace(/<\/form>/gi, `
          <input type="hidden" name="csrf_token" value="${res.locals.csrfToken}">
        </form>`);
      }

      // Call the original send function
      return originalSend.call(this, body);
    };

    next();
  };