const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    username: String,
    phone: String,
    title: String,
    category: String,
    description: String,
  },
  { timestamps: true },
);

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
