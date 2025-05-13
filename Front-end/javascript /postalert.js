// postAlert.js
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      alert('Blog post published successfully!');
      window.history.replaceState({}, document.title, window.location.pathname); // Keep the URL clean
    }
  });
  