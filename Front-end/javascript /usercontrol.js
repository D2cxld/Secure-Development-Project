document.addEventListener('DOMContentLoaded', async () => {
  const postsContainer = document.getElementById('user-posts-list');

  // Simulated current user ID (replace with session-based value later)
  const currentUserId = 1;

  try {
    const response = await fetch('/posts');
    const posts = await response.json();

    // Filter posts by simulated user ID
    const userPosts = posts.filter(post => post.user_id === currentUserId);

    if (!Array.isArray(userPosts) || userPosts.length === 0) {
      postsContainer.innerHTML = '<p>You have not posted anything yet.</p>';
      return;
    }

    postsContainer.innerHTML = '';

    userPosts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.classList.add('user-post');

      postDiv.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <small>Posted: ${new Date(post.created_at).toLocaleString()}</small>
        <button class="edit-btn" data-id="${post.id}">Edit</button>
        <button class="delete-btn" data-id="${post.id}">Delete</button>
        <hr>
      `;

      postsContainer.appendChild(postDiv);
    });

    // Delete 
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const postId = button.getAttribute('data-id');

        if (confirm('Are you sure you want to delete this post?')) {
          try {
            const res = await fetch(`/posts/${postId}`, {
              method: 'DELETE'
            });

            if (res.ok) {
              alert('Post deleted!');
              location.reload();
            } else {
              alert('Failed to delete post.');
            }
          } catch (err) {
            console.error('Delete error:', err);
            alert('Error deleting post.');
          }
        }
      });
    });

    // placeholder for future Edit logic
    document.querySelectorAll('.edit-btn').forEach(button => {
      button.addEventListener('click', () => {
        alert('Edit functionality will be implemented later.');
      });
    });

  } catch (error) {
    console.error('Failed to fetch posts:', error);
    postsContainer.innerHTML = '<p>Error loading posts.</p>';
  }
});
