// dovenv makes the .env file work as intended
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express')
const app = express();
const path = require('path')
const port = process.env.PORT || 3000;
const ejsMate = require('ejs-mate')
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const passport = require('passport');
const localStrategy = require('passport-local');
const Book = require('./models/Book');
const User = require('./models/User');
const Comment = require('./models/Comments')
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash')
const {isLoggedIn, isAuthor} = require('./middlewares.js')
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/books-app';
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended: true}))
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))

const secret = process.env.SECRET || 'secretzzz';

const store = new MongoStore({
    url: dbUrl,
    secret,
    // Interval (in seconds) between session updates.
    touchAfter: 24 * 60 * 60
})

store.on("error", function(e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next(); 
})


app.get('/register' , (req,res) => {
    res.render('register')
})

app.post('/register',  async (req,res) => {
    try {
        const {email, username, password} = req.body;
        const newUser = new User({email, username});
        const registeredUser = await User.register(newUser, password);
        
        registeredUser.save();
        req.session.user_id = registeredUser._id;
        res.redirect('/login');
    } catch (e) {
        req.flash('error',e.message);
    res.redirect('/register')
    }
})

app.get('/login', (req,res) => {
    res.render('login');
})

app.post('/login', passport.authenticate('local', {failureFlash: true, failureRedirect: '/login'}), (req, res) => {
    req.flash('success', 'Welcome back')
    const redirectUrl = req.session.returnTo || '/';
    // removes the "returnTo" session 
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
})

app.get('/new_book', isLoggedIn, (req, res) => {
    res.render('new_book')
})

app.post('/new_book', async (req, res) => {
    const {book_name, author, category, image, description} = req.body
    const username = req.user.username;
    const book = await new Book({book_name: book_name, author: author, category: category, image: image, post_author: username, description: description});
    await book.save();
    res.redirect('/home_page')
})

app.get('/books', async (req, res) => {
    const books = await Book.find({}).populate({
        path: 'comments',
        populate: {
            path: 'author'
        }
    }).populate('author');
    if (!books) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/home_page');
    }
    res.render('home_page', {books})
    
})

app.post('/books/:id/comments', async (req, res) => {
    const {id} = req.params;
    const books = await Book.findById(id);
    const {comment} = req.body;
    
    const comments = new Comment({body: comment, author: req.user._id});
    // comments.author = req.user._id;
    books.comments.push(comments);
    await comments.save();
    await books.save();
    res.redirect('/home_page')
})

app.delete('/books/:id/:reviewId', async (req, res) => {
    const {id, reviewId} = req.params;
    await Book.findByIdAndUpdate(id, {$pull: {comments: reviewId}});
    await Comment.findByIdAndDelete(reviewId);
    req.flash('success', "Successfully deleted comment");
    res.redirect("/home_page");
})


app.get('/:id/edit', isLoggedIn, isAuthor, async (req, res) => {
    const {id} = req.params;
    if (id.length != 24) {
        return res.redirect('/home_page')
    }
    const book = await Book.find({_id: id});
    if (book.length < 1) {
        return res.redirect('/home_page')
    }  
    res.render('edit_book', {book})
})

app.put('/:id/edit', async (req,res) => {
    
    const {id} = req.params;
    await Book.findByIdAndUpdate(id, req.body, {runValidators: true, new: true});
    
    res.redirect(`/home_page`)
    
})

app.delete('/:id', async (req,res) => {
    const {id} = req.params;
    const deleteBook = await Book.findByIdAndDelete(id);
    res.redirect('/home_page')
    
})

// For 404 routes
app.get('*', (req, res) => {
    res.redirect('books')
})

app.listen(port, (req,res) => {
    console.log(`Listening on port: ${port}`)
})
