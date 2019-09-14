const validator = require('validator');
const twilio = require('twilio')(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN,
);
const WorkCategories = require('../models/WorkCategories.js');
const { HelpRequest } = require('../models/HelpRequest');
const { Event, sharedEventId } = require('../models/Event');

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

  let helpRequest = new HelpRequest({
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
        return done(err);
      }
      if (existingEvent == null) {
        console.warn('No event found');
        return done(err);
      }

      if (existingEvent.volunteers.length === 0) {
        console.log('No volonteers');
        return done(err);
      }

      existingEvent.volunteers.forEach(volunteer => {
        User.findOne({ email: volunteer.email }, (err, user) => {
          if (err) {
            return done(err);
          }
          if (user != null && user.phone != null) {
            console.debug(
              'Sending message to: ' + user.phone + ', email: ' + user.email,
            );
            sendMessage(req, user.phone);
          }

          return done(err);
        });
      });
    });
  });
};
