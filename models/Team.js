const mongoose = require("../db/conn");
const { Schema } = mongoose;

const Team = mongoose.model(
  "Team",
  new Schema ({
    name: { type: String, required: true },
    email: { type: String, required: true },
    country: { type: String, required: true },
    league: { type: String, required: true },
    password: { type: String, required: true },
    image: { type: String },
  }),
);

module.exports = Team;