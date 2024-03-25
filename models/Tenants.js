const mongoose = require('mongoose');

const TenantsSchema = new mongoose.Schema({
  adminName: {
    type: String,
    required: [true, 'adminName required.'],
    trim: true
  },

  phoneNo: {
    type: String,
    required: [true, 'Please enter your Phone Number']
  },
  tenantName: {
    type: String,
    required: [true, 'Please enter tenant name']
  },

  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },

  tenant_db_url: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'user',
    required: true
  },
  createdAt: {
    type: Date
  },
  domain: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('tenants', TenantsSchema);
