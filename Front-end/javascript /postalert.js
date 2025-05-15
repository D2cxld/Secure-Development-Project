document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('success') === 'true') {
    alert('Blog post published successfully!');
    window.history.replaceState({}, document.title, window.location.pathname); // Clean URL
  }
});

document.getElementById('postForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const title = document.getElementById('post-title').value;
  const content = document.getElementById('post-content').value;

  const response = await fetch('/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content })
  });

  if (response.redirected) {
    window.location.href = response.url;  // Redirect to success page
  } else {
    alert('Post failed.');
  }
});
