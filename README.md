# Library API Quiz

Design and implement a RESTful API for a library management system.

## Setup

```bash
npm install
npm run seed   # creates and populates db/library.db
npm start      # starts the server on http://localhost:3000
```

For auto-reload during development:
```bash
npm run dev
```

## Database schema

```
authors
  id        INTEGER  (primary key)
  name      TEXT     (required)
  bio       TEXT

books
  id        INTEGER  (primary key)
  title     TEXT     (required)
  year      INTEGER
  author_id INTEGER  → authors.id  (required, cascades on delete)

loans
  id             INTEGER  (primary key)
  book_id        INTEGER  → books.id  (required)
  borrower_name  TEXT     (required)
  loaned_at      TEXT     (date string, defaults to today)
  returned_at    TEXT     (null until returned)
```

## Your task

Implement all route handlers in `src/routes/`. Each handler currently returns `501 Not Implemented`. Do not modify `src/index.js`, `db/database.js`, or `db/seed.js`.

---

## Required endpoints

### Authors

| Method | Path | Description |
|--------|------|-------------|
| GET | `/authors` | List all authors |
| GET | `/authors/:id` | Get one author — `404` if not found |
| POST | `/authors` | Create author — body: `{ name, bio? }` — respond `201` |
| PATCH | `/authors/:id` | Update `name` and/or `bio` — `404` if not found |
| DELETE | `/authors/:id` | Delete author (books cascade) — respond `204` — `404` if not found |
| GET | `/authors/:id/books` | List books by this author — `404` if author not found |

### Books

| Method | Path | Description |
|--------|------|-------------|
| GET | `/books` | List all books — supports `?author_id=<id>` filter |
| GET | `/books/:id` | Get one book including its author — `404` if not found |
| POST | `/books` | Create book — body: `{ title, year?, author_id }` — respond `201` — `404` if `author_id` not found |
| PATCH | `/books/:id` | Update `title`, `year`, and/or `author_id` — `404` if not found |
| DELETE | `/books/:id` | Delete book — respond `204` — `404` if not found |

### Loans

| Method | Path | Description |
|--------|------|-------------|
| GET | `/loans` | List all loans — supports `?returned=true\|false` filter |
| GET | `/loans/:id` | Get one loan including book info — `404` if not found |
| POST | `/loans` | Check out a book — body: `{ book_id, borrower_name }` — respond `201` — `404` if book not found — `409` if book already on active loan |
| PATCH | `/loans/:id/return` | Return a book (set `returned_at`) — `404` if loan not found — `409` if already returned |

---

## Bonus
### Create Swagger File

## Grading criteria

- **Correct HTTP methods** — GET for reads, POST for creates, PATCH for partial updates, DELETE for deletes
- **Correct status codes** — 200, 201, 204, 404, 409 used where specified
- **Proper use of URL params and query strings** — IDs in path, filters as query params
- **Meaningful JSON responses** — include the resource (or resources) in the body
- **Relationship handling** — `GET /books/:id` includes author data; `GET /loans/:id` includes book data
- **Business logic** — loan conflict check (409 when book already out), return idempotency check (409 when already returned)

## Testing

With the server running, execute:

```bash
bash test.sh
```

All 20 checks should pass when the implementation is complete.

# Library API — GraphQL Quiz

Design and implement a GraphQL API for the same library management system from the REST quiz.
You will use the same SQLite database and the same `db/database.js` connection.

---

## Setup

Install the additional dependencies:

```bash
npm install @apollo/server graphql
```

Create your entry point at `src/graphql-server.js` and start it with:

```bash
node src/graphql-server.js
# GraphQL sandbox available at http://localhost:4000
```

Suggested file structure (you decide the internals):

```
src/
  graphql-server.js   ← Apollo Server setup + listen
  graphql/
    schema.js         ← type definitions (gql)
    resolvers.js      ← resolver implementations
```

---

## Database reminder

Same three tables you worked with in the REST quiz:

```
authors  (id, name, bio)
books    (id, title, year, author_id → authors.id)
loans    (id, book_id → books.id, borrower_name, loaned_at, returned_at)
```

Re-seed at any time:

```bash
npm run seed
```

---

## Your task

Define the GraphQL schema and implement all resolvers listed below.
Do not modify `db/database.js` or `db/seed.js`.

---

## Required schema types

```graphql
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
}

type Loan {
  id: ID!
  book: Book!            # resolved
  borrowerName: String!
  loanedAt: String!
  returnedAt: String     # null until returned
}
```

---

## Required queries

| Query | Arguments | Description |
|-------|-----------|-------------|
| `authors` | — | Return all authors (each with their `books` resolved) |
| `author` | `id: ID!` | Return one author. Return `null` if not found |
| `books` | `authorId: ID` | Return all books. If `authorId` is provided, filter by that author |
| `book` | `id: ID!` | Return one book with `author` resolved. Return `null` if not found |
| `loans` | `returned: Boolean` | Return all loans. If `returned` is `true` filter to returned ones; `false` to active ones; omit for all |
| `loan` | `id: ID!` | Return one loan with `book` resolved. Return `null` if not found |

---

## Required mutations

### Author mutations

| Mutation | Arguments | Returns | Notes |
|----------|-----------|---------|-------|
| `createAuthor` | `name: String!, bio: String` | `Author!` | — |
| `updateAuthor` | `id: ID!, name: String, bio: String` | `Author` | Return `null` if not found |
| `deleteAuthor` | `id: ID!` | `Boolean!` | `true` on success, `false` if not found. Books cascade. |

### Book mutations

| Mutation | Arguments | Returns | Notes |
|----------|-----------|---------|-------|
| `createBook` | `title: String!, year: Int, authorId: ID!` | `Book!` | Throw if `authorId` does not exist |
| `updateBook` | `id: ID!, title: String, year: Int, authorId: ID` | `Book` | Return `null` if book not found |
| `deleteBook` | `id: ID!` | `Boolean!` | `true` on success, `false` if not found |

### Loan mutations

| Mutation | Arguments | Returns | Notes |
|----------|-----------|---------|-------|
| `checkoutBook` | `bookId: ID!, borrowerName: String!` | `Loan!` | Throw if book not found. Throw if book already on active loan. |
| `returnBook` | `loanId: ID!` | `Loan!` | Sets `returned_at` to today. Throw if loan not found or already returned. |

> For errors, throw a `GraphQLError` with a descriptive message. Do not return HTTP status codes — that is not how GraphQL signals errors.

---

## Grading criteria

- **Schema correctness** — types, fields, nullability (`!`) match the spec above
- **Resolver completeness** — every query and mutation is implemented and returns the right shape
- **Nested field resolution** — `Author.books`, `Book.author`, `Loan.book` are resolved via dedicated field resolvers, not embedded JOINs baked into the parent query
- **Argument filtering** — `books(authorId)` and `loans(returned)` filter correctly when arguments are provided
- **Error handling** — `checkoutBook` and `returnBook` throw on conflict; `createBook` throws on unknown `authorId`
- **No over-fetching in resolvers** — parent resolvers should not pre-fetch nested data speculatively; let field resolvers handle it

---

## Bonus

- Add an `activeLoans: [Loan!]!` field directly on `Book` that returns only non-returned loans
- Add pagination to `authors` and `books` using `limit` and `offset` arguments
- Create a `swagger.yaml` (or `openapi.json`) that documents the REST API from the first quiz

---

## Sample queries to test manually

Open the Apollo Sandbox at `http://localhost:4000` and try these:

```graphql
# List all authors with their books
query {
  authors {
    id
    name
    books {
      title
      year
    }
  }
}

# Get a single book with its author
query {
  book(id: "1") {
    title
    year
    author {
      name
    }
  }
}

# Filter to active (unreturned) loans
query {
  loans(returned: false) {
    id
    borrowerName
    loanedAt
    book {
      title
    }
  }
}

# Check out a book
mutation {
  checkoutBook(bookId: "5", borrowerName: "Carol White") {
    id
    loanedAt
    book {
      title
    }
  }
}

# Return it
mutation {
  returnBook(loanId: "3") {
    id
    returnedAt
  }
}

# Create then delete an author
mutation {
  createAuthor(name: "Ursula K. Le Guin", bio: "American author.") {
    id
    name
  }
}

mutation {
  deleteAuthor(id: "4")
}
```