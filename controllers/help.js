const validator = require('validator');
const twilio = require('twilio')(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN,
);
const WorkCategories = require('../models/WorkCategories.js');
const HelpRequest = require('../models/HelpRequest');
const { Event, sharedEventId } = require('../models/Event');
const User = require('../models/User');

/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  if (req.user == null) {
    return res.redirect('/login');
  }
  res.render('help', {
    title: 'Help',
    categories: WorkCategories.workCategories,
  });
};

function sendMessage(req, receiverPhoneNumber) {
  const message = {
    to: receiverPhoneNumber,
    from: '+17787711046',
    body:
      req.user.profile.name +
      ' needs help with ' +
      req.body.category +
      '! ' +
      req.body.message,
  };

  return twilio.messages.create(message);
}

function saveHelpRequest(req) {
  const helpRequest = new HelpRequest({
    from: req.user.email,
    category: req.body.category,
    descriptionMessage: req.body.message,
    eventId: sharedEventId,
  });
  return helpRequest.save();
}

async function notifyVolunteers(req, volunteers) {
  return Promise.all(
    volunteers
      .filter(user => {
        user.phone != null;
      })
      .map(user => {
        return sendMessage(user.phone);
      }),
  );
}

async function notifyEligibleVolunteers(req) {
  const event = await Event.findOne({ id: sharedEventId }).orFail(
    new Error('No event found!'),
  );

  let eligibleVolunteers = event.volunteers.filter(volunteer => {
    if (volunteer.categories.indexOf(req.body.category) === -1) {
      return false;
    } else {
      return true;
    }
  });

  if (eligibleVolunteers.length === 0) {
    console.log('No eligible volunteers found');
    return Promise.reject('No volunteers');
  }

  await notifyVolunteers(req, eligibleVolunteers);
}

exports.sendHelp = (req, res, next) => {
  const validationErrors = [];
  if (validator.isEmpty(req.body.message))
    validationErrors.push({ msg: 'Message cannot be blank.' });
  if (validator.isEmpty(req.body.category))
    validationErrors.push({ msg: 'You must select a category.' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/help');
  }

  saveHelpRequest(req)
    .then(() => notifyEligibleVolunteers(req))
    .then(
      () => {
        console.log('Did save and notified with success');
        req.flash('success', { msg: 'Did register help request' });
        res.redirect('/help');
      },
      error => {
        console.log('Failed, error: ' + error);
        req.flash('errors', { msg: error });
        res.redirect('/help');
      },
    );
};
