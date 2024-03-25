// const tenantUser = require("../models/TenantUser");
var mongoose = require('mongoose'),
  Admin = mongoose.mongo.Admin;

var dataBaseSchema = require('../models/TenantUser');

// const TenantUserModel = require("../models/TenantUser");

/**
 * 1. Connect local Mongo server and get all Database
 * 2. Match the DB name under username else create new DB
 * 3. Create Collection under new DB
 * @param {username} UserDbName
 */
async function createDB(tenantDbName, tenantObject, next) {
  console.log(tenantDbName);
  var uri = `mongodb://${process.env.MONGO_URL}`;

  var AdminDb = mongoose.createConnection(uri);
  AdminDb.on('open', async function() {
    var dbExists;
    const result = await new Admin(AdminDb.db).listDatabases();
    console.log(result);

    console.log('listDatabases succeeded');
    var allDatabases = result.databases;
    console.log(allDatabases);
    if (allDatabases.length > 0) {
      allDatabases.forEach(db => {
        if (db.name == `x_${tenantDbName}`) {
          console.log(`DB ${db.name} is already exits.`);
          dbExists = true;
        }
      });
      if (!dbExists) {
        console.log('create new DB');
        var newuri = `mongodb://${process.env.MONGO_URL}/x_${tenantDbName}`;
        console.log('Db Creating Process On....' + tenantDbName);
        var NewUserDb = mongoose.createConnection(newuri);
        const TenantUser = dataBaseSchema.createSchema(NewUserDb);

        // application.Role = "Admin";
        // application.Password = getHashedPassword(req.body.password);
        try {
          const newTenantUser = new TenantUser({
            name: tenantObject.name,
            email: tenantObject.email,
            password: tenantObject.password,
            phoneNo: tenantObject.phoneNo
          });

          await newTenantUser.save();
        } catch (error) {
          next(error);
        }

        AdminDb.close();
      }
    }

    console.log('Open master db');
  });
}

module.exports = { createDB };
