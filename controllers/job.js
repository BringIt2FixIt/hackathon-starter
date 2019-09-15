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
  console.log(req.body);
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
      res.redirect('/job');
    },
    error => {
      console.log('Failed, error: ' + error);
      req.flash('errors', { msg: error });
      res.redirect('/job');
    },
  );
};
