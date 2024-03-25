const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const Tenants = require('../models/Tenants');
const moment = require('moment');
const mongo = require('../utils/mongoService');

const createTenant = catchAsync(async (req, res, next) => {
  const { adminName, password, phoneNo, tenantName, email, domain } = req.body;

  try {
    const creator = await User.findById(req.params.userId)
      .lean()
      .exec();
    if (!creator) {
      return next(
        new AppError(`No User with the id of ${req.params.userId}`, 404)
      );
    }

    const createdDate = moment(new Date()).format('YYYY-MM-DD hh:mm:ss');

    // Hash password
    const hashedPwd = await bcrypt.hash(password, 12);

    const tenantObject = {
      adminName,
      phoneNo,
      tenantName,
      email,
      domain,
      password: hashedPwd,
      createdAt: createdDate,
      createdBy: req.params.userId
    };

    const tenantCreation = Tenants.create(tenantObject);
    if (!tenantCreation) {
      return next(new AppError(`Tenant creation has been failed`, 500));
    }
    await mongo.createDB(
      tenantObject.tenantName.toLowerCase(),
      tenantObject,
      next
    );

    res.status(200).json({
      status: 'success',
      message: 'Tenant has beenc created successfully!'
    });
  } catch (err) {
    return next(new AppError(`Something went wrong!`, 500));
  }
});

module.exports = {
  createTenant
};
