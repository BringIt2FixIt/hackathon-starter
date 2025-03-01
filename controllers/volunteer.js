const WorkCategories = require('../models/WorkCategories.js');
const { Event, sharedEventId } = require('../models/Event');

exports.getVolunteers = (req, res) => {
  const event = Event.findOne({ id: sharedEventId })
    .orFail(new Error('No event found!'))
    .then(
      event => {
        var cleanVolunteers = event.volunteers.map(volunteer => {
          return {
            email: volunteer.email,
            categories: volunteer.categories,
          };
        });
        res.render('volunteer/list', {
          title: 'List Volunteers',
          volunteers: cleanVolunteers,
        });
      },
      error => {
        res.render('volunteer/list', {
          title: 'List Volunteers',
          volunteers: [],
        });
      },
    );
};

exports.getVolunteerRegistration = (req, res) => {
  if (req.user == null) {
    return res.redirect('/login');
  }
  res.render('volunteer/register', {
    title: 'Register Volunteer',
    user: req.user,
    categories: WorkCategories.workCategories,
  });
};

exports.register = (req, res, next) => {
  console.log(req.body);
  const validationErrors = [];
  if (req.body.categories == null || req.body.categories.length === 0)
    validationErrors.push({ msg: 'Please choose at least 1 category.' });

  if (validationErrors.length) {
    console.log('Invalid input');
    req.flash('errors', validationErrors);
    return res.redirect('/volunteer');
  }
  Event.findOne({ id: sharedEventId }, (err, existingEvent) => {
    if (err) {
      req.flash('errors', 'an error occurred when finding event');
      return res.redirect('/volunteer');
    }
    if (existingEvent == null) {
      console.log('Creating event');
      const event = new Event({
        id: sharedEventId,
        volunteers: [
          {
            email: req.user.email,
            categories: req.body.categories,
          },
        ],
        participants: [],
      });
      event.save(err => {
        if (err) {
          return next(err);
        }
        console.log('Did save event');
        req.flash('success', { msg: `new event created` });
        res.redirect('/volunteer');
      });
    } else {
      console.log('Existing event found: ' + existingEvent.toString());

      let volunteer = existingEvent.volunteers.find(volunteer => {
        if (volunteer.email === req.user.email) {
          return true;
        } else {
          return false;
        }
      });
      if (volunteer == null) {
        console.log('Volunteer is not found');
        existingEvent.volunteers.push({
          email: req.user.email,
          categories: req.body.categories,
        });
      } else {
        console.log('User already exists, update categories');

        var index = existingEvent.volunteers.indexOf(volunteer);
        if (index !== -1) {
          volunteer.categories = req.body.categories;
          existingEvent.volunteers[index] = volunteer;
          console.log('Update user categories and save to the list');
        } else {
          console.warn('User index is not found');
          req.flash('errors', 'User exists, but index is not found');
          return res.redirect('/volunteer');
        }
      }

      existingEvent.save(err => {
        if (err) {
          return next(err);
        }
        console.log('Did save event');
        req.flash('success', { msg: `volunteer added` });
        res.redirect('/volunteer');
      });
    }
  });
};
