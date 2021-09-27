const Book = require('./models/Book')
const User = require('./models/User')

module.exports.isLoggedIn = (req, res, next) => {
 if (!req.isAuthenticated()) {
     // we need this line to make the req.session.returnTo work
     req.session.returnTo = req.originalUrl;
     req.flash('error', 'You must be signed in!');

    return res.redirect('/login')
    
 }
 next(); 
}

module.exports.isAuthor = async(req,res,next) => {
    const {id} = req.params
    const book = await Book.findById(id);
    if (book.post_author !== req.user.username) {
         req.flash('error', 'ERROR: You do not have permission to do that!');
         return res.redirect(`/home_page`)
    }
    next();
}


