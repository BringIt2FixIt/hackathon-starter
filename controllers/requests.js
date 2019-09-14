
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
  res.render('requests', {
    title: 'Requests',
    requests: FAKE_REQUESTS
  });
};