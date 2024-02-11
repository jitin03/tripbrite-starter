const catchAsync = require('../utils/catchAsync');

const getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'This is Tripbrite!'
  });
});

module.exports = {
  getMe
};
