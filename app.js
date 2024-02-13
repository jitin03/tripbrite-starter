const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const baseRouter = require('./routes/baseRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

// 3) ROUTES
app.use('/api/v1/me', baseRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   message: `Requested path is not found ${req.originalUrl}`
  // });

  next(new AppError(`Requested path is not found ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
