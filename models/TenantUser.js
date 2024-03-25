var mongoose = require('mongoose');

// var TenantUserSchema = mongoose.Schema;

const TenantUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },

    phoneNo: {
      type: String,
      required: [true, 'phone no required.'],
      trim: true,
      match: [/\d{10}/, 'Please add a valid phone no']
    },

    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false
    },
    active: {
      type: Boolean,
      default: true
    },
    refreshToken: String
  },

  { versionKey: false, collection: 'tenantUsers' }
);

const TenantUser = mongoose.model('TenantUser', TenantUserSchema);

module.exports = {
  createSchema: connection => {
    return connection.model('TenantUser', TenantUserSchema);
  },
  TenantUser: TenantUser, // Export the model directly
  TenantUserSchema
};

// module.exports = {
//   createSchema: createSchema,
// };
