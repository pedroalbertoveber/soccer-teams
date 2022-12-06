const Team = require("../models/Team");

/* external modules */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* helpers */
const createTeamToken = require("../helpers/create-team-token");
const getToken = require("../helpers/get-token");
const getTeamByToken = require("../helpers/get-team-by-token");

module.exports = class TeamController {
  static async registerTeam (req, res) {
    const { name, email, country, league, password, confirmpassword } = req.body;

    /* validations */
    if(!name) {
      res.status(422).json({ message: "O nome do clube é obrigatório!" });
      return;
    }
    if(!email) {
      res.status(422).json({ message: "O email do clube é obrigatório!" });
      return;
    }
    if(!country) {
      res.status(422).json({ message: "O país do clube é obrigatório!" });
      return;
    }
    if(!league) {
      res.status(422).json({ message: "A liga do clube é obrigatório!" });
      return;
    }
    if(!password) {
      res.status(422).json({ message: "A senha de cadastro do clube é obrigatório!" });
      return;
    }
    if(!confirmpassword) { 
      res.status(422).json({ message: "É necessário confirmar a senha" });
      return;
    }

    /* check if passwords match */
    if (String(password) !== String(confirmpassword)) {
      res.status(422).json({ message: "As senhas não são iguais!" });
      return;
    }

    /* check if team exists */
    const teamExists = await Team.findOne({ email: email });
    if(teamExists) {
      res.status(422).json({ message: "Este clube já está cadastrado!" });
      return;
    }

    /* check if already exists a team with the same name at the same league */
    const alreadyExists = await Team.findOne({ name: name, league: league });
    if(alreadyExists) {
      res.status(422).json({ message: `Este clube já está cadastrado sob e-mail: ${alreadyExists.email}`});
      return;
    }

    /* create a password */
    const salt = await bcrypt.genSalt(12);
    const hashPassword = await bcrypt.hash(password, salt);

    const team = new Team({
      name,
      email,
      country,
      league,
      password: hashPassword,
    });

    try {
      const newTeam = await team.save();
      createTeamToken(newTeam, req, res);
    } catch(err) {
      res.status(500).json({ message: "Erro de servidor. Tente novamente mais tarde!"})
    }
  }

  static async getAllTeams(req, res) {
    const teams = await Team.find().sort("-createdAt");

    if (teams.length === 0) {
      res.status(200).json({ message: "Nenhum time cadastrado!" });
      return;
    }

    res.status(200).json({ teams: teams });
  }

  static async login (req, res) {
    const { email, password } = req.body;

    /* validations */
    if(!email) {
      res.status(422).json({ message: "O email do clube é obrigatório!" });
      return;
    }
    if(!password) {
      res.status(422).json({ message: "A senha do clube é obrigatória!" });
      return;
    }

    /* check if user exists */
    const teamExists = await Team.findOne({ email: email });
    if (!teamExists) {
      res.status(422).json({ message: "O time ainda não está cadastrado!" });
      return;
    }

    /* check if password matches */
    const team = await Team.findOne({ email: email });
    const passwordMatches = await bcrypt.compare(password, team.password);

    if (!passwordMatches) {
      res.status(422).json({ message: "Senha incorreta!" });
      return;
    }

    try {
      await createTeamToken(team, req, res);
    } catch(err) {
      res.status(500).json({ message: err });
      return;
    }
  }

  static async getTeamById(req, res) {
    const id = req.params.id;

    const team = await Team.findById(id).select("-password");
    if(!team) {
      res.status(422).json({ message: "Time não localizado" });
      return;
    } 

    res.status(200).json({ team });
  }

  static async checkTeam(req, res) {
    let currentTeam;
    console.log(req.headers.authorization);

    if(req.headers["authorization"]) {

      const token = getToken(req);
      const decoded = jwt.verify(token, "secret");

      currentTeam = await Team.findById(decoded.id);
      currentTeam.password = undefined;

    } else {
      currentTeam = null;
    }

    res.status(200).send(currentTeam); 
  }

  static async editTeam(req, res) {
 
    const token = getToken(req);
    const team = await getTeamByToken(token);
    
    /* check if team exists */
    if (!team) {
      res.status(422).json({ message: "Time não encontrado!" });
      return;
    }

    const { name, email, country, league, password, confirmpassword } = req.body;
    let image = ""

    if(req.file) {
      image = req.file.filename;
    }

    /* validations */
    if(!name) {
      res.status(422).json({ message: "O nome do clube é obrigatório!" });
      return;
    }
    if(!email) {
      res.status(422).json({ message: "O email do clube é obrigatório!" });
      return;
    }

    /* check if email already exists */
    const emailExists = await Team.findOne({ email: email });
    if ( email !== team.email && emailExists) {
      res.status(422).json({ message: "E-mail já cadastrado para outro time!" });
      return;
    }

    if(!country) {
      res.status(422).json({ message: "O país do clube é obrigatório!" });
      return;
    }
    if(!league) {
      res.status(422).json({ message: "A liga do clube é obrigatória!" });
      return;
    }

    /* check if team already exists at the league */
    const teamExists = await Team.findOne({ name: name, league: league });
    if(name !== team.name && teamExists) {
      res.status(422).json({ message: "Este time já está cadastrado neste liga!" });
      return;
    }

    /* change password */
    if(password !== confirmpassword) {
      res.status(422).json({ message: "As senhas não conferem!" });
    } else if (password === confirmpassword && password != null) {

      /* creating a new password */
      const salt = await bcrypt.genSalt(12);
      const hashPassword = await bcrypt.hash(password, salt);

      team.password = hashPassword;
    }

    /* pre updated data */
    team.name = name;
    team.email = email;
    team.country = country;
    team.league = league;

    if(image) {
      const imageName = req.file.filename;
      team.image = imageName;
    }

    try {
      /* returs team's updated data */
      const updatedTeam = await Team.findOneAndUpdate(
        { _id: team._id },
        { $set: team },
        { new: true },
      );
      
      res.status(200).json({ message: "Time atualizado com sucesso!", data: updatedTeam });

    } catch(err) {
      res.status(500).json({ message: "Houve um erro ao processar sua requisição" });
      return;
    }
  }
};