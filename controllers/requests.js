const HelpRequest = require('../models/HelpRequest');

/**
 * GET /
 * Notifications page.
 */
exports.index = (req, res) => {
  HelpRequest.find({}, function(err, requests) {
    // res.send(userMap); 
    res.render('requests', {
      title: 'Requests',
      requests: requests
    }); 
  });
};