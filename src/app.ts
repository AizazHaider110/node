import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import mongoose, { Document } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import {User, IUser} from './models/user';
import Blog from './models/blog';
import cookieParser from 'cookie-parser';


dotenv.config();

export interface IBlog extends Document {
  title: string;
  snippet: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: string; 
}


interface AuthRequest extends Request {
  user?: any;
}

interface BlogRequestBody {
  title: string;
  snippet: string;
  body: string;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser());


// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Auth middleware
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.jwt || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('jwt');
    return res.redirect('/login');
  }
};

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


app.get('/register', (req: Request, res: Response) => {
  res.render('register', { title: 'Register', error: null });
});

app.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('register', {
        title: 'Register',
        error: 'Email and password are required'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', {
        title: 'Register',
        error: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.cookie('jwt', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect('/');
  } catch (err) {
    console.error('Registration error:', err);
    res.render('register', {
      title: 'Register',
      error: 'Registration failed'
    });
  }
});

app.get('/login', (req: Request, res: Response) => {
  res.render('login', { title: 'Login', error: null });
});

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('login', {
        title: 'Login',
        error: 'Email and password are required'
      });
    }

    const user = await mongoose.model('User').findOne({ email });
    if (!user) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid email or password'
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.cookie('jwt', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.render('login', {
      title: 'Login',
      error: 'Login failed'
    });
  }
});

app.get('/logout', (req: Request, res: Response) => {
  res.clearCookie('jwt');
  res.redirect('/login');
});

// Routes
// List all blogs
app.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const blogs = await Blog.find({author: req.user.userId}).sort({ createdAt: -1 });
    res.render('index', { title: 'Home', blogs });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Failed to fetch blogs' 
    });
  }
});

app.get('/blogs/create', authenticateToken, (req: AuthRequest, res: Response) => {
  res.render('create', { 
    title: 'Create a new blog',
    error: null
  });
});

app.post('/blogs', authenticateToken, async (req: Request<{}, {}, BlogRequestBody>, res: Response) => {
  try {
    const { title, snippet, body } = req.body;
    
    if (!title || !snippet || !body) {
      return res.render('create', {
        title: 'Create a new blog',
        error: 'All fields are required',
        user: (req as AuthRequest).user
      });
    }

    const newBlog = new Blog({
      title,
      snippet,
      body,
      author: (req as AuthRequest).user.userId
    });

    await newBlog.save();
    res.redirect('/');
  } catch (err) {
    console.error('Error creating blog:', err);
    res.render('create', {
      title: 'Create a new blog',
      error: 'Failed to create blog',
      user: (req as AuthRequest).user
    });
  }
});

app.get('/blogs/:id', authenticateToken, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('404', { title: '404', user: (req as AuthRequest).user });
    }
    res.render('details', { title: 'Blog Details', blog, user: (req as AuthRequest).user });
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(404).render('404', { title: '404', user: (req as AuthRequest).user });
  }
});

app.get('/blogs/:id/edit', authenticateToken, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).render('404', { title: '404', user: (req as AuthRequest).user });
    }
    res.render('edit', { 
      title: 'Edit Blog', 
      blog,
      error: null,
      user: (req as AuthRequest).user
    });
  } catch (err) {
    console.error('Error fetching blog:', err);
    res.status(404).render('404', { title: '404', user: (req as AuthRequest).user });
  }
});

app.post('/blogs/:id/edit', authenticateToken, async (req: Request<{ id: string }, {}, BlogRequestBody>, res: Response) => {
  try {
    const { title, snippet, body } = req.body;
    const id = req.params.id;

    if (!title || !snippet || !body) {
      return res.render('edit', {
        title: 'Edit Blog',
        blog: { _id: id, title, snippet, body },
        error: 'All fields are required',
        user: (req as AuthRequest).user
      });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id, 
      { title, snippet, body }, 
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).render('404', { title: '404', user: (req as AuthRequest).user });
    }

    res.redirect(`/blogs/${updatedBlog._id}`);
  } catch (err) {
    console.error('Error updating blog:', err);
    res.render('edit', {
      title: 'Edit Blog',
      blog: { _id: req.params.id, ...req.body },
      error: 'Failed to update blog',
      user: (req as AuthRequest).user
    });
  }
});

app.post('/blogs/:id/delete', authenticateToken, async (req: Request<{ id: string }>, res: Response) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) {
      return res.status(404).render('404', { title: '404', user: (req as AuthRequest).user });
    }
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).render('error', { 
      title: 'Error', 
      error: 'Failed to delete blog',
      user: (req as AuthRequest).user
    });
  }
});

app.get('/logout', authenticateToken, (req: Request, res: Response) => {
  try {
    // Clear the JWT cookie
    res.clearCookie('jwt');
    res.redirect('/login');
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).render('error', {
      title: 'Error',
      error: 'Logout failed',
      user: (req as AuthRequest).user
    });
  }
});

app.use((req: Request, res: Response) => {
  res.status(404).render('404', { title: '404', user: (req as AuthRequest).user });
});

export default app;