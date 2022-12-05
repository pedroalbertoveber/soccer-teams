const mongoose = require("../db/conn");
const { Schema } = mongoose;

const Player = mongoose.model(
  "Player",
  new Schema ({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    height: { type: Number, required: true },
    position: { type: String, required: true },
    function: { type: String, required: true },
    team: Object,
    borrower: Object,
  }, { timestamps: true }),
);

module.exports = Player;