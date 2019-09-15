const { Event, sharedEventId } = require('../models/Event');

exports.getAdmin = (req, res) => {
    res.render('admin', {});
};

exports.populateGoogleSheet = (req, res) => {
    Event.find({id: sharedEventId}, (err, existingEvents) => {
        if (err) {
            req.flash('errors', 'an error occurred when finding event');
            res.status(500);
            res.send();
        } else {
            req.flash('success', { msg: 'Awesome, it worked' });
            console.log(existingEvents);
            res.redirect('/admin');
        }
    });
};
