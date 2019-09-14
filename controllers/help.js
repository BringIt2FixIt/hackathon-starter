const validator = require('validator');
const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('help', {
    title: 'Help'
  });
};

exports.sendHelp = (req, res, next) => {
  const validationErrors = [];
  if (validator.isEmpty(req.body.message)) validationErrors.push({ msg: 'Message cannot be blank.' });

  if (validationErrors.length) {
    req.flash('errors', validationErrors);
    return res.redirect('/api/twilio');
  }

  // TODO: get the phone number for the right person from the database
  const message = {
    to: '+16047609035', // always send to Mike for now
    from: '+17787711046',
    body: req.body.message
  };
  twilio.messages.create(message).then((sentMessage) => {
    req.flash('success', { msg: `Text send to ${sentMessage.to}` });
    res.redirect('/api/twilio');
  }).catch(next);
};
