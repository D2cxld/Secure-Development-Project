const express = require('express');
const router = express.Router();
const postController = require('/Users/davidorji/Secure Development Project/Secure-Development-Project/backend/controllers /post.js'); // <-- adjust path if needed

// controller methods routes
router.get('/', postController.getPosts); // <-- THIS is what was missing
router.post('/', postController.createPost);
router.delete('/:id', postController.deletePost);
router.put('/:id', postController.updatePost || (() => {})); // fallback if undefined

module.exports = router;
