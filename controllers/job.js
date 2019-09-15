const WorkCategories = require('../models/WorkCategories.js');
const { Event, sharedEventId } = require('../models/Event');
const { Job, JobStatus } = require('../models/Job');
const validator = require('validator');
const twilio = require('twilio')(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN,
);

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

      // Notify current current user if he is the only one if the category specific queue.
      notifyNextVisitor(req.body.category, 1);

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
  const { category, show_completed } = req.query;
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

      if (show_completed == null || show_completed === false) {
        jobs = jobs.filter(job => job.status != JobStatus.DONE);
        console.debug(`Filter jobs (not done): ${jobs.length}`);
      } else {
        console.debug(`Return unfiltered result`);
      }

      jobs = jobs.sort((job1, job2) => job1.createdAt < job2.createdAt);

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

function sendMessage(job) {
  var username = job.username || 'Visitor';
  const message = {
    to: job.phone,
    from: '+17787711046',
    body: `Hi ${username}. You are next in '${job.category}' queue!`,
  };

  console.debug(`Send ${message}`);

  return twilio.messages.create(message);
}

function notifyNextVisitor(category, matchingJobLengthCount) {
  console.log(`Find next unfinished job for ${category}`);

  return Job.find({
    category: category,
    eventId: sharedEventId,
    status: JobStatus.NOT_DONE,
  }).then(
    jobs => {
      if (
        matchingJobLengthCount != null &&
        matchingJobLengthCount !== jobs.length
      ) {
        console.debug(
          `Expected: Don't send notification, mismatch between job count: ${jobs.length}, required: ${matchingJobLengthCount}`,
        );
        return;
      }

      console.debug(`Retrieved jobs: ${jobs.length}`);
      jobs = jobs.sort((job1, job2) => job1.createdAt < job2.createdAt);

      if (jobs.length === 0) {
        console.log(`No jobs in queue for category: ${category}`);
        return;
      }

      console.debug(`Notify next visitor in queue: ${jobs[0]}`);
      sendMessage(jobs[0]);
    },
    error => {
      console.error('Failed, error: ' + error);
    },
  );
}

exports.updateList = (req, res, next) => {
  console.log(
    `Update list: ${JSON.stringify(req.body)}, query: ${JSON.stringify(
      req.query,
    )}`,
  );

  const { requestId } = req.body;

  if (requestId == null || requestId.length === 0) {
    console.warn('Unkown request');
    req.flash('error', { msg: 'Unknown job request' });
    res.redirect(`/jobs`);
    return;
  }

  Job.findOne({ _id: requestId })
    .then(job => {
      console.log(`Did find job: ${job}`);

      job.status = JobStatus.DONE;

      job.save().then(() => {
        console.log(`Did update status for: ${job}`);

        notifyNextVisitor(job.category).then(
          () => console.log('Did handle notifying next client'),
          error => console.error('Failed to nofify, error: ' + error),
        );

        req.flash('success', { msg: 'Did update status' });
        ///?category=${job.category}
        if (req.query.category != null) {
          res.redirect(`/jobs?category=${req.query.category}`);
        } else {
          res.redirect(`/jobs`);
        }
      });
    })
    .catch(error => {
      console.log('Failed, error: ' + error);
      req.flash('errors', { msg: error });
    });
};
