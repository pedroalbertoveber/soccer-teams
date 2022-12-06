const jwt = require("jsonwebtoken");

const createTeamToken = async (team, req, res) => {
  const token = jwt.sign({
    name: team.name,
    id: team._id,
  }, "secret");

  res.status(200).json({
    maessage: "Autenticado!",
    token,
    teamId: team._id,
  });
};

module.exports = createTeamToken;