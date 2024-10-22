const mongoose = require('mongoose');

// Define the schema
const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  snippet: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
}, { timestamps: true });

// Create and export the model
const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
