document.addEventListener('DOMContentLoaded', async () => {
  const postsContainer = document.getElementById('admin-posts-list');

  try {
    const response = await fetch('/posts');
    const posts = await response.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      postsContainer.innerHTML = '<p>No posts found.</p>';
      return;
    }

    postsContainer.innerHTML = ''; 

    posts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.classList.add('admin-post');

      postDiv.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <small>Posted: ${new Date(post.created_at).toLocaleString()}</small>
        <button data-id="${post.id}" class="delete-btn">Delete</button>
        <hr>
      `;

      postsContainer.appendChild(postDiv);
    });

    attachDeleteHandlers();
  } catch (error) {
    console.error('Error loading posts:', error);
    postsContainer.innerHTML = '<p>Error loading posts. Please try again later.</p>';
  }
});

function attachDeleteHandlers() {
  const deleteButtons = document.querySelectorAll('.delete-btn');

  deleteButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const postId = button.getAttribute('data-id');

      const confirmed = confirm('Are you sure you want to delete this post?');
      if (!confirmed) return;

      try {
        const response = await fetch(`/posts/${postId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          alert('Post deleted!');
          location.reload();
        } else {
          alert('Failed to delete post.');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('An error occurred while trying to delete the post.');
      }
    });
  });
}
