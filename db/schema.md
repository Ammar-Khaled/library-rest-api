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