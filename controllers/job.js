const WorkCategories = require('../models/WorkCategories.js');
const { Event, sharedEventId } = require('../models/Event');
const Job = require('../models/Job');
const validator = require('validator');

exports.getRegistration = (req, res) => {
  res.render('job/register', {
    title: 'Register Volunteer',
    categories: WorkCategories.workCategories,
  });
};

exports.register = (req, res, next) => {
  console.log(req.body);
  const validationErrors = [];
  if (req.body.category == null)
    validationErrors.push({ msg: 'Category should be specified.' });
  if (req.body.username == null || req.body.username.length === 0)
    validationErrors.push({ msg: 'Username should be specified.' });
  if (req.body.title == null || req.body.username.title === 0)
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
  //   Event.findOne({ id: sharedEventId }, (err, existingEvent) => {
  //     if (err) {
  //       req.flash('errors', 'an error occurred when finding event');
  //       return res.redirect('/volunteer');
  //     }
  //     if (existingEvent == null) {
  //       console.log('Creating event');
  //       const event = new Event({
  //         id: sharedEventId,
  //         volunteers: [
  //           {
  //             email: req.user.email,
  //             categories: req.body.categories,
  //           },
  //         ],
  //         participants: [],
  //       });
  //       event.save(err => {
  //         if (err) {
  //           return next(err);
  //         }
  //         console.log('Did save event');
  //         req.flash('success', { msg: `new event created` });
  //         res.redirect('/volunteer');
  //       });
  //     } else {
  //       console.log('Existing event found: ' + existingEvent.toString());

  //       let volunteer = existingEvent.volunteers.find(volunteer => {
  //         if (volunteer.email === req.user.email) {
  //           return true;
  //         } else {
  //           return false;
  //         }
  //       });
  //       if (volunteer == null) {
  //         console.log('Volunteer is not found');
  //         existingEvent.volunteers.push({
  //           email: req.user.email,
  //           categories: req.body.categories,
  //         });
  //       } else {
  //         console.log('User already exists, update categories');

  //         var index = existingEvent.volunteers.indexOf(volunteer);
  //         if (index !== -1) {
  //           volunteer.categories = req.body.categories;
  //           existingEvent.volunteers[index] = volunteer;
  //           console.log('Update user categories and save to the list');
  //         } else {
  //           console.warn('User index is not found');
  //           req.flash('errors', 'User exists, but index is not found');
  //           return res.redirect('/volunteer');
  //         }
  //       }

  //       existingEvent.save(err => {
  //         if (err) {
  //           return next(err);
  //         }
  //         console.log('Did save event');
  //         req.flash('success', { msg: `volunteer added` });
  //         res.redirect('/volunteer');
  //       });
  //     }
  //   });
};
