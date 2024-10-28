import { Document } from 'mongoose';

export interface IBlog extends Document {
  title: string;
  snippet: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

import express, { Request, Response, NextFunction} from 'express';
import morgan from 'morgan';
import path from 'path';
import mongoose from 'mongoose';

import Blog from './models/blog';

const app = express();
const PORT = process.env.PORT || 3000;


// Custom type for request body
interface BlogRequestBody {
  title: string;
  snippet: string;
  body: string;
}

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
const startServer = async() => {
  try {
     await mongoose.connect(dbURI);
     app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  }  catch(err){
    console.log(err);
  }
};

startServer();


// Routes
// List all blogs
app.get('/', async (req: Request, res: Response) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.render('index', { title: 'Home', blogs });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Failed to fetch blogs' 
    });
  }
});

app.get('/blogs/create', (req: Request, res: Response) => {
  res.render('create', { 
    title: 'Create a new blog',
    error: null
  });
});

app.post('/blogs', async (req: Request<{}, {}, BlogRequestBody>, res: Response) => {
  try {
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

    await newBlog.save();
    res.redirect('/');
  } catch (err) {
    console.error('Error creating blog:', err);
    res.render('create', {
      title: 'Create a new blog',
      error: 'Failed to create blog'
    });
  }
});

interface BlogParams {
  id: string;
}

app.get('/blogs/:id', async (req: Request<BlogParams>, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('404', { title: '404' });
    }
    res.render('details', { title: 'Blog Details', blog });
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(404).render('404', { title: '404' });
  }
});

app.get('/blogs/:id/edit', async (req: Request<BlogParams>, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('404', { title: '404' });
    }
    res.render('edit', { 
      title: 'Edit Blog', 
      blog,
      error: null 
    });
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(404).render('404', { title: '404' });
  }
});

app.post('/blogs/:id/edit', async (req: Request<BlogParams, {}, BlogRequestBody>, res: Response) => {
  try {
    const { title, snippet, body } = req.body;
    const id = req.params.id;

    if (!title || !snippet || !body) {
      return res.render('edit', {
        title: 'Edit Blog',
        blog: { _id: id, title, snippet, body },
        error: 'All fields are required'
      });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id, 
      { title, snippet, body }, 
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).render('404', { title: '404' });
    }

    res.redirect(`/blogs/${updatedBlog._id}`);
  } catch (err) {
    console.error('Error updating blog:', err);
    res.render('edit', {
      title: 'Edit Blog',
      blog: { _id: req.params.id, ...req.body },
      error: 'Failed to update blog'
    });
  }
});

app.post('/blogs/:id/delete', async (req: Request<BlogParams>, res: Response) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).render('404', { title: '404' });
    }
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Failed to delete blog' 
    });
  }
});

app.use((req: Request, res: Response) => {
  res.status(404).render('404', { title: '404' });
});

export default app;