const pool = require('../db'); 

// Create a new post
exports.createPost = async (req, res) => {
  console.log('Session user:', req.session.user); 

  const { title, content } = req.body;
  const userId = req.session.user?.id; 

  if (!userId) {
    return res.status(401).send('User not logged in');
  }

  try {
    await pool.query(
      'INSERT INTO userpost (title, content, user_id) VALUES ($1, $2, $3)',
      [title, content, userId]
    );
    res.redirect('/post?success=true');
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).send('Server error');
  }
};

// Get posts, search function
exports.getPosts = async (req, res) => {
  const searchQuery = req.query.q || '';

  try {
    const result = await pool.query(
      `
      SELECT userpost.id, userpost.title, userpost.content, userpost.user_id, userpost.created_at
      FROM userpost
      JOIN userlogin ON userpost.user_id = userlogin.id
      WHERE title ILIKE $1 OR content ILIKE $1
      ORDER BY created_at DESC
      `,
      [`%${searchQuery}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// Delete a post by id
exports.deletePost = async (req, res) => {
  const postId = req.params.id;

  try {
    const result = await pool.query('DELETE FROM userpost WHERE id = $1', [postId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Failed to delete post' });
  }
};

exports.getAllPostsForAdmin = async (req, res) => {
  const isAdmin = req.session?.user?.isAdmin;

  if (!isAdmin) {
    return res.status(403).json({ message: 'Access denied: admin only.' });
  }

  try {
    const result = await pool.query(
      `SELECT userpost.id, userpost.title, userpost.content, userpost.created_at, userpost.user_id 
       FROM userpost 
       ORDER BY userpost.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all posts for admin:', err);
    res.status(500).json({ message: 'Failed to retrieve posts' });
  }
};

