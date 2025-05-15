document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/posts'); // Adjust the path based on your routing
    const posts = await response.json();

    const userPostsContainer = document.querySelector('.posts-list');
    const trendingContainer = document.querySelector('.trending-container');

    // Clear default messages
    userPostsContainer.innerHTML = '';
    trendingContainer.innerHTML = '';

    posts.forEach((post, index) => {
      // Create user post block
      const postBlock = document.createElement('div');
      postBlock.classList.add('post');
      postBlock.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <small>Posted on: ${new Date(post.created_at).toLocaleDateString()}</small>
      `;
      userPostsContainer.appendChild(postBlock);

      // Trending post block (first 5 posts or based on another logic)
      if (index < 5) {
        const trendBlock = document.createElement('div');
        trendBlock.classList.add('trending-post');
        trendBlock.innerHTML = `
          <h4>${post.title}</h4>
          <p>${post.content.substring(0, 80)}...</p>
          <small>${new Date(post.created_at).toLocaleDateString()}</small>
        `;
        trendingContainer.appendChild(trendBlock);
      }
    });
  } catch (err) {
    console.error('Failed to load posts:', err);
  }
});
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('.search-box input');
  const postsList = document.querySelector('.posts-list');         // Adjust if yours is named differently
  const trendingList = document.querySelector('.trending-container');

  async function fetchAndDisplayPosts(query = '') {
    try {
      const response = await fetch(`/posts?q=${encodeURIComponent(query)}`);
      const posts = await response.json();

      postsList.innerHTML = '';
      trendingList.innerHTML = '';

      if (posts.length === 0) {
        postsList.innerHTML = '<p>No posts found.</p>';
        return;
      }

      posts.forEach((post, index) => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post');
        postDiv.innerHTML = `
          <h3>${post.title}</h3>
          <p>${post.content}</p>
          <small>Posted on: ${new Date(post.created_at).toLocaleDateString()}</small>
        `;
        postsList.appendChild(postDiv);

        if (index < 5) {
          const trendDiv = document.createElement('div');
          trendDiv.classList.add('trending-post');
          trendDiv.innerHTML = `
            <h4>${post.title}</h4>
            <p>${post.content.substring(0, 80)}...</p>
            <small>${new Date(post.created_at).toLocaleDateString()}</small>
          `;
          trendingList.appendChild(trendDiv);
        }
      });
    } catch (err) {
      console.error('Search failed:', err);
    }
  }

  // Load all posts on page load
  fetchAndDisplayPosts();

  // Update on input
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    fetchAndDisplayPosts(query);
  });
});

