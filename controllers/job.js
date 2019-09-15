const WorkCategories = require('../models/WorkCategories.js');
const { Event, sharedEventId } = require('../models/Event');
const { Job, JobStatus } = require('../models/Job');
const validator = require('validator');

exports.getRegistration = (req, res) => {
  res.render('job/register', {
    title: 'Register Volunteer',
    categories: WorkCategories.workCategories,
  });
};

function saveJob(req) {
  const job = new Job({
    username: req.body.username,
    phone: req.body.phone,
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    eventId: sharedEventId,
    status: JobStatus.NOT_DONE,
  });
  console.debug(`Save new job: ${job}`);
  return job.save();
}

exports.register = (req, res, next) => {
  console.log(`Register: ${req.body}`);
  const validationErrors = [];
  if (req.body.category == null || req.body.category.length === 0)
    validationErrors.push({ msg: 'Category should be specified.' });
  if (req.body.username == null || req.body.username.length === 0)
    validationErrors.push({ msg: 'Username should be specified.' });
  if (req.body.title == null || req.body.title.length === 0)
    validationErrors.push({ msg: 'Title should be specified.' });
  if (req.body.description == null || req.body.description.length === 0)
    validationErrors.push({ msg: 'Job Description should be specified.' });
  if (req.body.phone == null || !validator.isMobilePhone(req.body.phone))
    validationErrors.push({ msg: 'Please enter a valid mobile phone number.' });

  if (validationErrors.length) {
    console.log('Invalid input');
    req.flash('errors', validationErrors);
    return res.redirect('/job');
  }

  saveJob(req).then(
    () => {
      console.log('Did save');
      req.flash('success', { msg: 'Did save' });
      res.redirect(`/jobs?category=${req.body.category}`);
    },
    error => {
      console.log('Failed, error: ' + error);
      req.flash('errors', { msg: error });
      res.redirect(`/job`);
    },
  );
};

exports.list = (req, res, next) => {
  const { category } = req.query;
  console.log(
    `List for category: ${category}, all params: ${JSON.stringify(req.query)}`,
  );

  let loadJobListTask = null;
  if (category != null) {
    console.debug(`Retrieve list for category: ${category}`);
    loadJobListTask = Job.find({
      category: category,
      eventId: sharedEventId,
    });
  } else {
    loadJobListTask = Job.find({ eventId: sharedEventId });
  }

  loadJobListTask.then(
    jobs => {
      console.log(`Did load: ${jobs.length}`);

      req.flash('success', { msg: 'Did load' });
      res.render('job/list', {
        title: 'Job Request List',
        category: category,
        requests: jobs,
      });
    },
    error => {
      console.log('Failed, error: ' + error);
      req.flash('errors', { msg: error });
    },
  );
};

exports.updateList = (req, res, next) => {
  console.log(`Update list: ${JSON.stringify(req.body)}`);

  const { requestId } = req.body;

  if (requestId == null || requestId.length === 0) {
    console.warn('Unkown request');
    req.flash('error', { msg: 'Unknown job request' });
    res.redirect(`/jobs`);
    return;
  }

  Job.findOneAndUpdate({ _id: requestId }, { status: JobStatus.DONE }).then(
    () => {
      console.log(`Did update status for: ${requestId}`);

      req.flash('success', { msg: 'Did update status' });
      res.redirect(`/jobs`);
    },
    error => {
      console.log('Failed, error: ' + error);
      req.flash('errors', { msg: error });
    },
  );
};
