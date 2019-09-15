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

  console.debug(
    `Send ${req.body.message} (${req.body.categor}) to ${receiverPhoneNumber} (${req.user.profile.name})`,
  );

  return twilio.messages.create(message);
}

function saveHelpRequest(req) {
  const helpRequest = new HelpRequest({
    from: req.user.email,
    category: req.body.category,
    message: req.body.message,
    eventId: sharedEventId,
  });
  return helpRequest.save();
}

async function notifyVolunteers(req, volunteers) {
  return Promise.all(
    volunteers
      .filter(user => {
        return user.phone != null;
      })
      .map(user => {
        return sendMessage(req, user.phone);
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
    return Promise.reject('Sorry - there are no volunteers for that category!');
  }

  let eligibleVolunteerEmails = eligibleVolunteers.map(
    volunteer => volunteer.email,
  );
  let allUsers = await User.find().orFail(new Error('No user found!'));
  let eligibleVolunteerUsers = allUsers.filter(user => {
    if (eligibleVolunteerEmails.indexOf(user.email) === -1) {
      return false;
    } else {
      return true;
    }
  });

  console.log(
    `All users: ${allUsers.length}, eligible: ${eligibleVolunteerUsers.length}`,
  );

  if (eligibleVolunteers.length !== eligibleVolunteerUsers.length) {
    console.log('Mismatch between volunteer and user count');
    return Promise.reject('Internal error');
  }

  await notifyVolunteers(req, eligibleVolunteerUsers);
}

exports.sendHelp = (req, res, next) => {
  const validationErrors = [];
  if (req.body.message == null || validator.isEmpty(req.body.message))
    validationErrors.push({ msg: 'Message cannot be blank.' });
  if (req.body.category == null || validator.isEmpty(req.body.category))
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
        req.flash('success', { msg: 'Sent help request!  Someone should be on their way' });
        res.redirect('/help');
      },
      error => {
        console.log('Failed, error: ' + error);
        req.flash('errors', { msg: error });
        res.redirect('/help');
      },
    );
};
