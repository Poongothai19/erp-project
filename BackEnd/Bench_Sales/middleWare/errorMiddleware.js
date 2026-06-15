// middleware/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // SQL Server errors
  if (err.name === 'ConnectionError') {
    const message = 'Database connection failed';
    error = { message, status: 500 };
  }

  if (err.name === 'RequestError') {
    const message = 'Database request failed';
    error = { message, status: 500 };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, status: 400 };
  }

  // Duplicate key error
  if (err.number === 2627) { // SQL Server duplicate key error
    const message = 'Duplicate resource';
    error = { message, status: 400 };
  }

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};

module.exports = errorHandler;