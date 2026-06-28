const { GraphQLError } = require('graphql');
const db = require('../../db/database');

const resolvers = {
  Query: {
    authors: (_, { limit, offset }) => {
      let query = 'SELECT * FROM authors';
      const params = [];
      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
        if (offset) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }
      return db.prepare(query).all(...params);
    },
    author: (_, { id }) => {
      const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(id);
      return author || null;
    },
    books: (_, { authorId, limit, offset }) => {
      let query = 'SELECT * FROM books';
      const params = [];
      if (authorId) {
        query += ' WHERE author_id = ?';
        params.push(authorId);
      }
      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
        if (offset) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }
      return db.prepare(query).all(...params);
    },
    book: (_, { id }) => {
      const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
      return book || null;
    },
    loans: (_, { returned }) => {
      if (returned === true) {
        return db.prepare('SELECT * FROM loans WHERE returned_at IS NOT NULL').all();
      } else if (returned === false) {
        return db.prepare('SELECT * FROM loans WHERE returned_at IS NULL').all();
      }
      return db.prepare('SELECT * FROM loans').all();
    },
    loan: (_, { id }) => {
      const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
      return loan || null;
    }
  },
  
  Mutation: {
    createAuthor: (_, { name, bio }) => {
      const info = db.prepare('INSERT INTO authors (name, bio) VALUES (?, ?)').run(name, bio || null);
      return db.prepare('SELECT * FROM authors WHERE id = ?').get(info.lastInsertRowid);
    },
    updateAuthor: (_, { id, name, bio }) => {
      const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(id);
      if (!author) return null;

      const newName = name || author.name;
      const newBio = bio || author.bio;

      db.prepare('UPDATE authors SET name = ?, bio = ? WHERE id = ?').run(newName, newBio, id);
      return db.prepare('SELECT * FROM authors WHERE id = ?').get(id);
    },
    deleteAuthor: (_, { id }) => {
      const info = db.prepare('DELETE FROM authors WHERE id = ?').run(id);
      return info.changes > 0;
    },
    createBook: (_, { title, year, authorId }) => {
      const author = db.prepare('SELECT id FROM authors WHERE id = ?').get(authorId);
      if (!author) {
        throw new GraphQLError(`Author with id ${authorId} not found`);
      }
      const info = db.prepare('INSERT INTO books (title, year, author_id) VALUES (?, ?, ?)').run(title, year || null, authorId);
      return db.prepare('SELECT * FROM books WHERE id = ?').get(info.lastInsertRowid);
    },
    updateBook: (_, { id, title, year, authorId }) => {
      const book = db.prepare('SELECT * FROM books WHERE id = ?').get(id);
      if (!book) return null;

      if (authorId) {
        const author = db.prepare('SELECT id FROM authors WHERE id = ?').get(authorId);
        if (!author) {
          throw new GraphQLError(`Author with id ${authorId} not found`);
        }
      }

      const newTitle = title || book.title;
      const newYear = year || book.year;
      const newAuthorId = authorId || book.author_id;

      db.prepare('UPDATE books SET title = ?, year = ?, author_id = ? WHERE id = ?').run(newTitle, newYear, newAuthorId, id);
      return db.prepare('SELECT * FROM books WHERE id = ?').get(id);
    },
    deleteBook: (_, { id }) => {
      const info = db.prepare('DELETE FROM books WHERE id = ?').run(id);
      return info.changes > 0;
    },
    checkoutBook: (_, { bookId, borrowerName }) => {
      const book = db.prepare('SELECT * FROM books WHERE id = ?').get(bookId);
      if (!book) {
        throw new GraphQLError(`Book with id ${bookId} not found`);
      }

      const activeLoan = db.prepare('SELECT * FROM loans WHERE book_id = ? AND returned_at IS NULL').get(bookId);
      if (activeLoan) {
        throw new GraphQLError(`Book with id ${bookId} is already checked out`);
      }

      const info = db.prepare('INSERT INTO loans (book_id, borrower_name) VALUES (?, ?)').run(bookId, borrowerName);
      return db.prepare('SELECT * FROM loans WHERE id = ?').get(info.lastInsertRowid);
    },
    returnBook: (_, { loanId }) => {
      const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);
      if (!loan) {
        throw new GraphQLError(`Loan with id ${loanId} not found`);
      }
      if (loan.returned_at) {
        throw new GraphQLError(`Loan with id ${loanId} is already returned`);
      }

      const today = new Date().toISOString().split('T')[0];
      db.prepare('UPDATE loans SET returned_at = ? WHERE id = ?').run(today, loanId);

      return db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);
    }
  },

  Author: {
    books: (author) => {
      return db.prepare('SELECT * FROM books WHERE author_id = ?').all(author.id);
    }
  },

  Book: {
    author: (book) => {
      return db.prepare('SELECT * FROM authors WHERE id = ?').get(book.author_id);
    },
    activeLoans: (book) => {
      return db.prepare('SELECT * FROM loans WHERE book_id = ? AND returned_at IS NULL').all(book.id);
    }
  },

  Loan: {
    book: (loan) => {
      return db.prepare('SELECT * FROM books WHERE id = ?').get(loan.book_id);
    },
    borrowerName: (loan) => loan.borrower_name,
    loanedAt: (loan) => loan.loaned_at,
    returnedAt: (loan) => loan.returned_at
  }
};

module.exports = resolvers;
