const pool = require('../db'); // Correct relative path from controllers folder

exports.createPost = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).send('User not logged in');
  }

  try {
    await pool.query(
      'INSERT INTO userpost (title, content, user_id) VALUES ($1, $2, $3)',
      [title, content, userId]
    );
    res.redirect('/post.html?success=true');
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).send('Server error');
  }
};


// backend/controllers/post.js

exports.getPosts = async (req, res) => {
  const searchQuery = req.query.q || '';

  try {
    const result = await pool.query(
      `
      SELECT userpost.id, title, content, created_at, user_id, users.username
      FROM userpost
      JOIN users ON userpost.user_id = users.id
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



