const jwt = require("jsonwebtoken");
const getToken = require("./get-token");

const verifyToken = (req, res, next) => {
  if(!req.headers.authorization) {
    return res.status(401).json({ message: "Acesso negado!" });
  }

  const token = getToken(req);

  if(!token) {
    return res.status(401).json({ message: "Acesso negado!" });
  }

  try {
    const verified = jwt.verify(token, "secret");
    req.team = verified;
    next();

  } catch(err) {
    res.status(400).json({ message: "Token Inválido!", err });
  }
};

module.exports = verifyToken;