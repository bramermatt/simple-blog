const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('./blog.db');

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})
const upload = multer({ storage });

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);


app.get('/', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.render('index', { posts: rows });
    });
});

app.get('/new', (req, res) => {
    res.render('new');
});

app.post('/new', upload.single('image'), (req, res) => {
    if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).send('No file uploaded');
    }
    if (!req.body.title || !req.body.content) {
        console.error('Title or content missing');
        return res.status(400).send('Title and content are required');
    }
    if (req.file.size > 5 * 1024 * 1024) { // 5MB limit
        console.error('File size exceeds limit');
        return res.status(400).send('File size exceeds limit of 5MB');
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(req.file.mimetype)) {
        console.error('Invalid file type');
        return res.status(400).send('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
    }
    const { title, content } = req.body;
    const image = req.file ? req.file.filename : null;

    console.log('Received form data:', { title, content, image });

    db.run('INSERT INTO posts (title, content, image) VALUES (?, ?, ?)', [title, content, image], function (err) {
        if (err) {
            console.error('DB insert error:', err.message);
            return res.status(500).send('Error saving post');
        }
        console.log('Post saved with ID:', this.lastID);
        res.redirect('/');
    });
});


app.listen(3000, () => {
    console.log('Blog running on http://localhost:3000');
})
