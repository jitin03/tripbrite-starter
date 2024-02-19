const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('./../utils/email');

const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  console.log(user);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

const googleLogin = catchAsync(async (req, res, next) => {
  const { googleId, email, name, googleImage } = req.body;

  try {
    const user = await User.findOne({ googleId: googleId });
    if (user) {
      user.firstLogin = false;
      await user.save();
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        googleImage: user.googleImage,
        googleId: user.googleId,
        firstLogin: user.firstLogin,
        token: signToken(user._id, user.role),
        active: user.active
      });
    } else {
      const newUser = await User.create({
        name,
        email,
        googleId,
        googleImage
      });

      if (!newUser) {
        return next(new AppError(`User creation failed`, 500));
      }

      createSendToken(newUser, 201, res);
    }
  } catch (e) {
    return next(new AppError(`Something went wrong!`, 404));
  }
});

const signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    phoneNo: req.body.phoneNo
  });

  if (!newUser) {
    return next(new AppError(`User creation failed`, 500));
  }

  const emailVerificationToken = newUser.generateEmailVerificationToken();
  await newUser.save({ validateBeforeSave: false });

  // 3) Send it to user's email for verification
  const verificationURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/verification/${emailVerificationToken}`;

  const message = `Please verify your emailaddress to create an account with us: ${verificationURL}.\nIf it's not you, please ignore this email!`;

  try {
    await sendEmail({
      email: req.body.email,
      subject: 'Verify your account (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Verification email has been sent!'
    });
  } catch (err) {
    newUser.emailVerificationToken = undefined;
    newUser.emailVerificationExpires = undefined;
    await newUser.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }

  // createSendToken(newUser, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { phoneNo, password } = req.body;
  if (!phoneNo || !password) {
    return next(new AppError(' Please provide Phone No and Pin', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ phoneNo }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect phoneNo or password', 401));
  }
  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ phoneNo: req.body.phoneNo });
  if (!user) {
    return next(new AppError('There is no user with phoneNo.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
  // res.status(200).json({
  //   status: 'success',
  //   message: 'Token sent to email!',
  //   data: resetURL
  // });
});

const verifyAccount = catchAsync(async (req, res, next) => {
  console.log('inside veiri');
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user,
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  const result = await User.updateOne(
    { emailVerificationToken: hashedToken },
    {
      $set: {
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined
      }
    },
    {
      upsert: true
    }
  );
  console.log(result);
  res.status(200).json({
    status: 'success',
    message: 'Your account has been verified successfully now!'
  });
});

const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  googleLogin,
  verifyAccount
};
