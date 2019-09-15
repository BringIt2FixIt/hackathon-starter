const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema(
  {
    /**
     * Email of the user who needs help.
     */
    from: String,
    category: String,
    message: String,
    eventId: String,
  },
  { timestamps: true },
);

const HelpRequest = mongoose.model('HelpRequest', helpRequestSchema);
module.exports = HelpRequest;
