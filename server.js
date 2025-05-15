const express = require("express");
const path = require("path");
const session = require("express-session");
const { Pool } = require("pg");

const app = express();
const PORT = 5500;

//PostgreSQL Connection 
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'blogsdb',
  password: 'Nightcrawler007',
  port: 5434,
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("PostgreSQL connection error:", err.stack));

// Middleware 
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } 
}));

// ===== Static Files =====
app.use('/styles.css', express.static(path.join(__dirname, 'styles.css')));
app.use('/js', express.static(path.join(__dirname, 'front-end/javascript')));
app.use(express.static(path.join(__dirname, 'public')));

// ===== Routes =====
const registerRouter = require('./backend/routes/reg')(pool);
app.use('/register', registerRouter);

const loginRouter = require('./backend/routes/log')(pool);
app.use('/login', loginRouter);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Body:`, req.body);
  next();
});

const postRouter = require('./backend/routes/postroutes');
app.use('/posts', postRouter);

const sessionRoutes = require('./backend/routes/sessionroutes');
app.use('/session', sessionRoutes);

// Routes 

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end/blogpage.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end/admin.html'));
});

app.get('/user-control', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end/usercontrol.html'));
});

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'test.html'));
});

app.get('/post', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'post.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'itslogin.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'register.html'));
});

app.get('/reset', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'resetpass.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'homepage.html'));
});



// Error 404
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Port listen 
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});