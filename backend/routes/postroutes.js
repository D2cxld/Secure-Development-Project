const express = require('express');
const router = express.Router();
const postController = require('/Users/davidorji/Secure Development Project/Secure-Development-Project/backend/controllers /post.js');

router.post('/', postController.createPost); // POST /posts
// backend/routes/postroutes.js
router.get('/', postController.getPosts);

router.delete('/:id', postController.deletePost);

module.exports = router;
