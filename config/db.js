const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(
    `mongodb://${process.env.MONGO_URL}/master`
  );

  console.log(`DB connection successful! ${conn.connection.host}`);
};
module.exports = connectDB;
