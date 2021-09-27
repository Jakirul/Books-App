const mongoose = require('mongoose')
const Comments = require('./Comments')
const Schema = mongoose.Schema

const BookSchema = new Schema({
    book_name: String,
    image: String,
    author: String,
    category: String,
    description: String,
    post_author: String,
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Comments'
        }
    ]
})

BookSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Comments.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model("Book", BookSchema)