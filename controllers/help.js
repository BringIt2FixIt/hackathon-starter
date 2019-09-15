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

function sendMessage(req, res, next, receiverPhoneNumber) {
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

  twilio.messages
    .create(message)
    .then(sentMessage => {
      req.flash('success', { msg: `Text send to ${sentMessage.to}` });
      return res.redirect('/help');
    })
    .catch(next);
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

  const helpRequest = new HelpRequest({
    from: req.user.email,
    category: req.body.category,
    descriptionMessage: req.body.message,
    eventId: sharedEventId,
  });
  helpRequest.save(err => {
    if (err) {
      return next(err);
    }
    console.log('Did save new request');

    Event.findOne({ id: sharedEventId }, (err, existingEvent) => {
      if (err) {
        return next(err);
      }
      if (existingEvent == null) {
        console.warn('No event found');
        return next(err);
      }

      if (existingEvent.volunteers.length === 0) {
        console.log('No volonteers');
        return next(err);
      }

      let aligibleVolunteers = existingEvent.volunteers.filter(volunteer => {
        if (volunteer.categories.indexOf(req.body.category) === -1) {
          return false;
        } else {
          return true;
        }
      });

      if (aligibleVolunteers.length === 0) {
        console.log('No eligible volunteers found');
        return res.redirect('/help');
      }

      aligibleVolunteers.forEach(volunteer => {
        User.findOne({ email: volunteer.email }, (err, user) => {
          if (err) {
            return next(err);
          }
          if (user == null) {
            console.log('No user');
            return next(err);
          }

          if (user.phone != null) {
            console.debug(
              'Sending message to: ' + user.phone + ', email: ' + user.email,
            );
            sendMessage(req, res, next, user.phone);
          }

          return res.redirect('/help');
        });
      });
    });
  });
};
