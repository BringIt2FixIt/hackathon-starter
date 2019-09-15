const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    id: String,
    volunteers: [
      {
        email: String,
        categories: [String],
      },
    ],
  },
  { timestamps: true },
);

const Event = mongoose.model('Event', eventSchema);
module.exports = {
  Event: Event,
  /**
   * Hardcoded event id. For now there will be only 1 at any point of time.
   */
  sharedEventId: 1,
};
