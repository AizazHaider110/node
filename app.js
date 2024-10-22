const express = require('express');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');

const Blog = require('./models/blog');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection (modify your dbURI as needed)
const dbURI = 'mongodb+srv://aizaz265:aizaz265@node.y5ou5.mongodb.net/?retryWrites=true&w=majority&appName=node';
mongoose.connect(dbURI)
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => console.log(err));



// Routes
// List all blogs
app.get('/', (req, res) => {
  Blog.find()
    .then(blogs => {
      res.render('index', { title: 'Home', blogs });
    })
    .catch(err => console.error(err));
});

app.get('/blogs/create', (req, res) => {
  res.render('create', { 
    title: 'Create a new blog',
    error: null
  });
});

app.post('/blogs', (req, res) => {
  const { title, snippet, body } = req.body;
  
  if (!title || !snippet || !body) {
    return res.render('create', { 
      title: 'Create a new blog', 
      error: 'All fields are required' 
    });
  }

  const newBlog = new Blog({
    title,
    snippet,
    body
  });

  newBlog.save()
    .then(() => res.redirect('/'))
    .catch(err => {
      console.error('Error creating blog:', err);
      res.render('create', { 
        title: 'Create a new blog', 
        error: 'Failed to create blog' 
      });
    });
});


app.get('/blogs/:id', (req, res) => {
  const id = req.params.id;

  Blog.findById(id)
    .then(blog => {
      if (!blog) {
        return res.status(404).render('404', { title: '404' });
      }
      res.render('details', { title: 'Blog Details', blog });
    })
    .catch(err => {
      console.error('Error fetching blog:', err);
      res.status(404).render('404', { title: '404' });
    });
});


app.post('/blogs/:id/edit', (req, res) => {
  const id = req.params.id;
  const { title, snippet, body } = req.body;

  if (!title || !snippet || !body) {
    return res.render('edit', {
      title: 'Edit Blog',
      blog: { _id: id, title, snippet, body },
      error: 'All fields are required'
    });
  }

  Blog.findByIdAndUpdate(id, { title, snippet, body }, { new: true })
    .then(updatedBlog => res.redirect(`/blogs/${updatedBlog._id}`))
    .catch(err => {
      console.error('Error updating blog:', err);
      res.render('edit', {
        title: 'Edit Blog',
        blog: { _id: id, title, snippet, body },
        error: 'Failed to update blog'
      });
    });
});


// Delete blog
app.post('/blogs/:id/delete', (req, res) => {
  const id = req.params.id;

  Blog.findByIdAndDelete(id)
    .then(() => res.redirect('/'))
    .catch(err => {
      console.error('Error deleting blog:', err);
      res.status(500).render('error', { title: 'Error', error: 'Failed to delete blog' });
    });
});


// 404 page
app.use((req, res) => {
  res.status(404).render('404', { title: '404' });
});

