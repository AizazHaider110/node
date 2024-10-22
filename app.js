const express = require('express');
const morgan = require('morgan');
const path = require('path');

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

// Sample blog data
let blogs = [
  {
    id: '1',
    title: 'Yoshi finds eggs',
    snippet: 'Lorem ipsum dolor sit amet consectetur',
    body: 'Full blog post about Yoshi finding eggs...'
  },
  {
    id: '2',
    title: 'Mario finds stars',
    snippet: 'Lorem ipsum dolor sit amet consectetur',
    body: 'Full blog post about Mario finding stars...'
  }
];

const generateId = () => Date.now().toString();

// Routes
// List all blogs
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Home',
    blogs
  });
});

app.get('/blogs/create', (req, res) => {
  res.render('create', { 
    title: 'Create a new blog',
    error: null
  });
});

app.post('/blogs', (req, res) => {
  try {
    const { title, snippet, body } = req.body;
    
    if (!title || !snippet || !body) {
      return res.render('create', {
        title: 'Create a new blog',
        error: 'All fields are required'
      });
    }
    
    const newBlog = {
      id: generateId(),
      title,
      snippet,
      body
    };
    
    blogs.push(newBlog);
    res.redirect('/');
  } catch (err) {
    console.error('Error creating blog:', err);
    res.render('create', {
      title: 'Create a new blog',
      error: 'Failed to create blog'
    });
  }
});


app.get('/blogs/:id', (req, res) => {
  const blog = blogs.find(b => b.id === req.params.id);
  
  if (!blog) {
    return res.status(404).render('404', { title: '404' });
  }
  
  res.render('details', { title: 'Blog Details', blog });
});

app.get('/blogs/:id/edit', (req, res) => {
  const blog = blogs.find(b => b.id === req.params.id);
  
  if (!blog) {
    return res.status(404).render('404', { title: '404' });
  }
  
  res.render('edit', { 
    title: 'Edit Blog',
    blog,
    error: null
  });
});

app.post('/blogs/:id/edit', (req, res) => {
  try {
    const { title, snippet, body } = req.body;
    const id = req.params.id;
    
    if (!title || !snippet || !body) {
      const blog = blogs.find(b => b.id === id);
      return res.render('edit', {
        title: 'Edit Blog',
        blog,
        error: 'All fields are required'
      });
    }
    
    const index = blogs.findIndex(b => b.id === id);
    if (index === -1) {
      return res.status(404).render('404', { title: '404' });
    }
    
    blogs[index] = {
      id,
      title,
      snippet,
      body
    };
    
    res.redirect(`/blogs/${id}`);
  } catch (err) {
    console.error('Error updating blog:', err);
    res.render('edit', {
      title: 'Edit Blog',
      blog: { id: req.params.id, ...req.body },
      error: 'Failed to update blog'
    });
  }
});

// Delete blog
app.post('/blogs/:id/delete', (req, res) => {
  try {
    const id = req.params.id;
    blogs = blogs.filter(b => b.id !== id);
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).render('error', {
      title: 'Error',
      error: 'Failed to delete blog'
    });
  }
});

// 404 page
app.use((req, res) => {
  res.status(404).render('404', { title: '404' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});