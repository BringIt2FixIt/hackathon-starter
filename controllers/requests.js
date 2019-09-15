const HelpRequest = require('../models/HelpRequest');

const FAKE_REQUESTS = [
  {
    from: 'Ted',
    category: 'bikes',
    message: 'help me!',
    status: 'open'
  },
  {
    from: 'Mike',
    category: 'electronics',
    message: 'help me!',
    status: 'open'
  }
]

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