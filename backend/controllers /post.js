const pool = require('../db');

exports.createPost = async (req, res) => {
  const { title, content } = req.body;

  try {
    await pool.query(
      'INSERT INTO userpost (title, content) VALUES ($1, $2)',
      [title, content]
    );
    res.redirect('/front-end/post.html?success=true');
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).send('Server error');
  }
};
