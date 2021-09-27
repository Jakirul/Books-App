const mongoose = require('mongoose');
const Book = require("../models/Book");
const Comments = require('../models/Comments')
mongoose.connect('mongodb://localhost:27017/books-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// const sample = array => array[Math.floor(Math.random() * array.length )];

const seedDB = async() => {
    // this deletes everything
    await Book.deleteMany({});
    await Comments.deleteMany({});
    for (let i = 0; i < 10; i++) {
        const book = new Book({
            book_name: "The Body Coach",
            image: 'https://cdn.waterstones.com/bookjackets/large/9781/5098/9781509856184.jpg',
            author: "Joe Wicks",
            category: "Cooking",
            description: "This book is actually pretty good. Actually im lying. this book is awful",
            post_author: "Jakirul"


        })
        await book.save();
    }
}

// seedsDB() connects to the databse. the .then() is something after, so here we then close the db
seedDB().then(() => {
    console.log("closing db...")
    mongoose.connection.close();
})