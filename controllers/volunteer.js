var WorkCategories = require("../models/WorkCategories.js");

exports.getVolunteerRegistration = (req, res) => {
  if (req.user == null) {
    return res.redirect("/login");
  }
  res.render("volunteer/register", {
    title: "Register Volunteer",
    categories: WorkCategories.workCategories
  });
};
