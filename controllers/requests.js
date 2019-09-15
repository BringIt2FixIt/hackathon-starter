const HelpRequest = require('../models/HelpRequest');

/**
 * GET /
 * Notifications page.
 */
exports.index = (req, res) => {
  HelpRequest.find({}).sort({_id: -1}).exec(function(err, requests) {
    // res.send(userMap); 
    res.render('requests', {
      title: 'Requests',
      requests: requests
    }); 
  });
};