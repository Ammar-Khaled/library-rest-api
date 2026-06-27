const express = require('express');

const authorsRouter = require('./routes/authors');
const booksRouter   = require('./routes/books');
const loansRouter   = require('./routes/loans');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/authors', authorsRouter);
app.use('/books',   booksRouter);
app.use('/loans',   loansRouter);

app.listen(PORT, () => {
  console.log(`Library API running on http://localhost:${PORT}`);
});
