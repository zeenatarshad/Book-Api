require("dotenv").config();
// Framework
const express = require("express");
const mongoose = require("mongoose");

// Database
const database = require("./database/index");

// Models
const BookModel = require("./database/book");
const AuthorModel = require("./database/author");
const PublicationModel = require("./database/publication");

// Initializing Express
const shapeAI = express();

// Configurations 
shapeAI.use(express.json());

console.log(process.env.MONGO_URL);

// establish database connection
mongoose
 .connect(process.env.MONGO_URL,
 {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
 }
)
.then(() => console.log("connection established!!"));

/* 
Route                /
Description          to get all books
Access               PUBLIC
Parameters           NONE
Method               GET
*/
shapeAI.get("/", async (req, res) => {
    const getAllBooks = await BookModel.find();
    console.log(getAllBooks);
    return res.json(getAllBooks);
});

/* 
Route                /is
Description          to get specific book based on ISBN
Access               PUBLIC
Parameters           isbn
Method               GET
*/

shapeAI.get("/is/:isbn", async (req, res) => {
    const getSpecificBook = await BookModel.findOne({ ISBN: req.params.isbn})
   


    if(!getSpecificBook) {
        return res.json({
             error: `No book found for the ISBN of ${req.params.isbn}`,
     });
    }

    return res.json({ book: getSpecificBook});

});

/* 
Route                /c
Description          to get specific books based on category
Access               PUBLIC
Parameters           category
Method               GET
*/
shapeAI.get("/c/:category", async (req, res) =>{
    const  getSpecificBooks = await BookModel.findOne({
        category: req.params.category, 
    });

    if(!getSpecificBooks){
        return res.json({ error: `No book found for the category of ${req.params.category}`,
     });
    }

    return res.json({ book: getSpecificBooks});
});

/* 
Route                /author
Description          to get all authors
Access               PUBLIC
Parameters           NONE
Method               GET
*/
shapeAI.get("/author" , async (req, res) => {
    const getAllAuthors = await AuthorModel.find();
    return res.json({authors: getAllAuthors });
} );

/* 
Route                /author
Description          to get a list of authors based on a book's ISBN
Access               PUBLIC
Parameters           isbn
Method               GET
*/
shapeAI.get("/author/:isbn", (req, res) => {
    const getSpecificAuthors = database.authors.filter((author) =>
    author.books.includes(req.params.isbn)
    );

    if (getSpecificAuthors.length === 0) {
        return res.json({
            error: `No author found for the book ${req.params.isbn}`,
        });
    }

    return res.json({ authors: getSpecificAuthors });
});

/* 
Route                /publications
Description          to get all publications
Access               PUBLIC
Parameters           NONE
Method               GET
*/
shapeAI.get("/publications", (req, res) => {
    return res.json({ publications: database.publications });
});

/* 
Route                /book/new
Description          add new books
Access               PUBLIC
Parameters           NONE
Method               POST
*/
shapeAI.post("/book/new", async (req, res) => {
    const {newBook} = req.body;

    const addNewBook = BookModel.create(newBook);

    
     return res.json({  message: "book was added!"});
});

/* 
Route                /author/new
Description          add new author
Access               PUBLIC
Parameters           NONE
Method               POST
*/
shapeAI.post("/author/new", async (req, res) => {
    const{ newAuthor } = req.body;
 
    AuthorModel.create(newAuthor);

    return res.json({ message: "author was added!"});
});

/* 
Route                /book/update
Description          update title of a book
Access               PUBLIC
Parameters           isbn
Method               PUT
*/
shapeAI.put("/book/update/:isbn", async (req, res) => {
   
    const updatedBook= await BookModel.findOneAndUpdate({
        ISBN: req.params.isbn,
    },
    {
        title: req.body.bookTitle,
    },
    {
        new: true,    // to get updated data
    }
    );

    return res.json({ books: updatedBook });
});

/* 
Route                /book/author/update
Description          update/add new author
Access               PUBLIC
Parameters           isbn
Method               PUT
*/
shapeAI.put("/book/author/update/:isbn", async (req, res) => {
    // update the book database

     const updatedBook = await BookModel.findOneAndUpdate({
         ISBN: req.params.isbn,
     },
     {
          $addToSet: {
              authors: req.body.newAuthor,
          },
     },
     {
         new: true,
     });
    
  //database.books.forEach((book) => {
      //  if (book.ISBN === req.params.isbn)
        //return book.authors.push(req.body.newAuthor);
    //});

    // update the author database

    const updatedAuthor = await AuthorModel.findOneAndUpdate({
        id: req.body.newAuthor,
    },
    {
         $addToSet: {
             books: req.params.isbn,
         },
    },
    {
        new: true,
    });
    //database.authors.forEach((author) => {
      //  if (author.id === req.body.newAuthor)
        //return author.books.push(req.params.isbn);
    //});

    return res.json({
        books: updatedBook,
        authors:updatedAuthor,
        message: "New author was added",
    });
});

/* 
Route                /publication/update/book
Description          update/add a new book to a publication
Access               PUBLIC
Parameters           isbn
Method               PUT
*/
shapeAI.put("/publication/update/book/:isbn", (req, res) => {
    // update the publication database
    database.publications.forEach((publication) => {
        if (publication.id === req.body.pubId) {
          return publication.books.push(req.params.isbn);
        }
    });

    // update the book database
    database.books.forEach((book) => {
        if(book.ISBN === req.params.isbn) {
            book.publication = req.body.pubId;
            return;
        }
    });

    return res.json({
        books: database.books,
        publications: database.publications,
        message: "Successfully updated publication",
    });
});

/* 
Route                /book/delete
Description          delete a book
Access               PUBLIC
Parameters           isbn
Method               DELETE
*/
shapeAI.delete("/book/delete/:isbn", async(req, res) => {

    const updatedBookDatabase = await BookModel.findOneAndDelete({
        ISBN: req.params.isbn,
    });

    //const updatedBookDatabase = database.books.filter(
      //  (book) => book.ISBN !== req.params.isbn
    //);

    //database.books = updatedBookDatabase;
    return res.json( { books: updatedBookDatabase} );
});

/* 
Route                /book/delete/author
Description          delete a author from a book
Access               PUBLIC
Parameters           isbn, author id
Method               DELETE
*/
shapeAI.delete("/book/delete/author/:isbn/:authorId", async (req, res) => {
        // update the book database

        const updatedBook = await BookModel.findOneIdAndUpdate({
            ISBN: req.params.isbn,
        },
        {
            $pull: {
                authors: parseInt(req.params.authorId),
            },
        },
        {new: true}
        );

        // database.books.forEach((book) => {
         //   if (book.ISBN === req.params.isbn) {
           //     const newAuthorList = book.authors.filter(
             //       (author) => author !== parseInt(req.params.authorId)
               // );
                // book.authors = newAuthorList;
                //return;
            //}
        //});

        // update the author database

        const updatedAuthor = await AuthorModel.findOneAndUpdate({
            id: parseInt(req.params.authorId),
        },
        {
            $pull: {
                books: req.params.isbn,
            },
        },
        {new: true}
        );




      //  database.authors.forEach((author) => {
        //    if (author.id === parseInt(req.params.authorId)) {
          //      const newBooksList = author.books.filter(
            //        (book) => book !== req.params.isbn
             //   );

             //   author.books = newBooksList;
              //  return;
           // }
       // });

        return res.json({
            message: "author was deleted :`(",
            book: updatedBook,
            author: updatedAuthor,
        });
});

/* 
Route                /publication/delete/book
Description          delete a book from publication
Access               PUBLIC
Parameters           isbn, publication id
Method               DELETE
*/
shapeAI.delete("/publication/delete/book/:isbn/:pubId", (req, res) => {
      // update publication database
      database.publications.forEach((publication) => {
          if (publication.id === parseInt(req.params.pubId)) {
              const newBooksList = publication.books.filter(
                  (book) => book !== req.params.isbn 
              );

              publication.books = newBooksList;
              return;
          }
      });

      // update book database
      database.books.forEach((book) => {
          if (book.ISBN === req.params.isbn) {
              book.publication = 0;         // no publication available
              return;
          }
      });

      return res.json({ 
          books: database.books ,
          publications: database.publications,
    });
});

shapeAI.listen(3000, () => console.log("Server Running!! ;)"));
