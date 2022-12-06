const jwt = require("jsonwebtoken");
const Team = require("../models/Team");

const getTeamByToken = async (token) => {

  if(!token) {
    return res.status(401).json({ message: "Acesso negado!" });
  }

  const decoded = jwt.verify(token, "secret");

  const teamId = decoded.id;
  const team = await Team.findOne({ _id: teamId });
  
  return team;
};

module.exports = getTeamByToken;
