const mongoose = require('mongoose');

const JobStatus = Object.freeze({
  NOT_DONE: 'not_done',
  DONE: 'done',
});
const jobSchema = new mongoose.Schema(
  {
    username: String,
    phone: String,
    title: String,
    category: String,
    description: String,
    eventId: String,
    status: String,
  },
  { timestamps: true },
);

const Job = mongoose.model('Job', jobSchema);
module.exports = {
  Job: Job,
  JobStatus: JobStatus,
};
