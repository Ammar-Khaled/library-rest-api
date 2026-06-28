const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    bio: String
    books: [Book!]!        # resolved — not a raw JOIN column
  }

  type Book {
    id: ID!
    title: String!
    year: Int
    author: Author!        # resolved — not a raw foreign key
    activeLoans: [Loan!]!
  }

  type Loan {
    id: ID!
    book: Book!            # resolved
    borrowerName: String!
    loanedAt: String!
    returnedAt: String     # null until returned
  }

  type Query {
    authors(limit: Int, offset: Int): [Author!]!
    author(id: ID!): Author
    books(authorId: ID, limit: Int, offset: Int): [Book!]!
    book(id: ID!): Book
    loans(returned: Boolean): [Loan!]!
    loan(id: ID!): Loan
  }

  type Mutation {
    createAuthor(name: String!, bio: String): Author!
    updateAuthor(id: ID!, name: String, bio: String): Author
    deleteAuthor(id: ID!): Boolean!
    createBook(title: String!, year: Int, authorId: ID!): Book!
    updateBook(id: ID!, title: String, year: Int, authorId: ID): Book
    deleteBook(id: ID!): Boolean!
    checkoutBook(bookId: ID!, borrowerName: String!): Loan!
    returnBook(loanId: ID!): Loan!
  }
`;

module.exports = typeDefs;
