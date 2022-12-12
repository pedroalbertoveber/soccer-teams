const Player = require("../models/Player");
const ObjectId = require("mongoose").Types.ObjectId;

/* helpers */
const getToken = require("../helpers/get-token");
const getTeamByToken = require("../helpers/get-team-by-token");


module.exports = class PlayerController {

  static async registerPlayer(req, res) {
    const { name, age, height, position } = req.body;
    const image = req.file;

    /* validations */
    if(!name) {
      res.status(422).json({ message: "O nome do jogador é obrigatório!" });
      return;
    }
    if(!age) {
      res.status(422).json({ message: "A idade do jogador é obrigatória!" });
      return;
    }
    if(!height) {
      res.status(422).json({ message: "A altura do jogador é obrigatória!" });
      return;
    }
    if(!position) {
      res.status(422).json({ message: "A posição do jogador é obrigatória!" });
      return;
    }
    if(!image) {
      res.status(422).json({ message: "A imagem do jogador é obrigatória!" });
      return;
    }

    const token = getToken(req);
    const team = await getTeamByToken(token);

    /* check if team really exists */
    if(!team) {
      res.status(422).json({ message: "Você não pode cadastrar um jogador sem clube!" });
      return;
    }

    /* check if player already exists */
    const alreadyExists = await Player.findOne({ name: name, position: position });

    if (alreadyExists && alreadyExists.team.name === team.name) {
      res.status(422).json({ message: "Este jogador já está cadastrado neste clube!" });
      return;
    } else if (alreadyExists && alreadyExists.team.name !== team.name) {
      res.status(422).json({ 
        messagem: `Este jogador já está cadastrado no time: ${alreadyExists.team.name }`,
      });
      return;
    }

    const player = new Player ({
      name,
      age,
      height,
      position,
      image: image.filename,
      available: true,
      team: {
        name: team.name,
        email: team.email,
        _id: team._id,
        country: team.country,
        league: team.league,
      }
    });

    try {
      const newPlayer = await player.save();
      res.status(201).json({ message: `Jogador cadastrado no clube ${player.team.name}`, newPlayer });
      return;

    } catch(err) {
      res.status(500).json({ message: "Ocorreu um erro ao processar sua solicitação" });
      return;
    }
  }

  static async getPlayers(req, res) {
    const players = await Player.find().sort("-createdAt");
    
    res.status(200).json({ players: players });
  }

  static async getPlayersByTeam(req, res) {
    const token = getToken(req);
    const team = await getTeamByToken(token);

    if(!team) {
      res.status(422).json({ message: "Você precisa ter um clube cadastrado para consultar os seus jogadores!" });
      return;
    }

    const teamPlayers = await Player.find({ "team._id": team._id });

    if(teamPlayers.length === 0) {
      res.status(201).json({ message: "Você ainda não possui jogadores cadastrados!" });
      return;
    }

    res.status(201).json({ players: teamPlayers });
  }

  static async editPlayer(req, res) {
    const token = getToken(req);
    const team = await getTeamByToken(token);

    const id = req.params.id;

    /* check if is a valid Id */
    if(!ObjectId.isValid(id)) {
      res.status(422).json({ message: "ID Inválido!" });
      return;
    }

    if(!team) {
      res.status(422).json({ message: "Você precisa ter um clube para editar o seu jogador!" });
      return;
    }

    /* check if this player belongs to this team */
    const player = await Player.findById(id);

    /* check if player exists */
    if(!player) {
      res.status(422).json({ message: "Jogador não localizado!" });
      return;
    }

    if (String(player.team._id) !== String(team._id)) {
      res.status(422).json({ message: "Você não pode editar um jogador com o clube diferente do seu!" });
      return;
    }

    const { name, age, height, position } = req.body;
    const image = req.file;

    /* validations */
    if(!name) {
      res.status(422).json({ message: "O nome do jogador é obrigatório" });
      return;
    }

    if(!age) {
      res.status(422).json({ message: "A idade do jogador é obrigatória" });
      return;
    }

    if(!height) {
      res.status(422).json({ message: "A altura do jogador é obrigatória" });
      return;
    }

    if(!position) {
      res.status(422).json({ message: "A posição do jogador é obrigatória" });
      return;
    }

    /* check if player already exists on this team or another one */
    const alreadyExists = await Player.findOne({ name: name, position: position });
    if(name !== player.name && alreadyExists && String(alreadyExists.team._id) === String(team._id)) {
      res.status(422).json({ message: "Este jogador já está cadastrado neste time!" });
      return;
    } else if (name !== player.name && alreadyExists) {
      res.status(422).json({ message: `Este jogador já está cadastrado no time: ${alreadyExists.team.name}` });
      return;
    }

    let updatedPlayer;
    
    /* updating player */

    if(!image) {
      updatedPlayer = {
        name,
        age,
        height,
        position,
        image: player.image,
        available: true,
      };
    } else {
      updatedPlayer = {
        name,
        age,
        height,
        position,
        image: image.filename,
        available: true,
      };
    }

    await Player.findByIdAndUpdate(id, updatedPlayer);
    res.status(200).json({ message: "Jogador atualizado com sucesso!" });
  }

  static async getPlayerById(req, res) {
    const id = req.params.id;

    if(!ObjectId.isValid(id)) {
      res.status(422).json({ message: "Id Inválido!" });
      return;
    }

    const player = await Player.findById(id).lean();

    /* check if players exists */
    if(!player) {
      res.status(422).json({ message: "Jogador não encontrado!" });
      return;
    }

    res.status(200).json({ player: player });
  }

  static async loanRequest(req, res) {
    const id = req.params.id;
    const token = getToken(req);
    const team = await getTeamByToken(token);

    /* check if really has a team */
    if(!team) {
      res.status(422).json({ message: "É necessário ter um time para solicitar empréstimo deste jogador!" });
      return;
    }

    /* check if is a valid id */
    if(!ObjectId.isValid(id)) {
      res.status(422).json({ message: "Id Inválido!" });
      return;
    }

    /* check if player exists and is available */
    const player = await Player.findById(id).lean();

    if(!player) {
      res.status(422).json({ message: "Jogador não localizado!" });
      return;
    } else if (!player.available) {
      res.status(422).json({ message: "Este jogador já foi emprestado!" });
      return;
    }

    /* check if team isnt trying to loan its own player */
    if(String(team._id) === String(player.team._id)) {
      res.status(422).json({ message: "Você não pode solicitar um empréstimo do seu próprio jogador!" });
      return;
    }

    /* check if your team has already requested the loan */
    if (player.borrower) {
      if(player.borrower._id.equals(team._id)) {
        res.status(422).json({ message: "Você já enviou uma solicitação de empréstimo para este jogador!" });
        return;
      } else {
        res.status(422).json({ message: "Este jogador já está avançando com contrato de empréstimo com outro time!" });
        return;
      }
    }

    player.borrower = {
      _id: team._id,
      name: team.name,
      country: team.country,
      league: team.league,
      image: team.image,
    };

    try {
      await Player.findByIdAndUpdate(id, player);
      res.status(200).json({ message: `Solicitação de empréstimo enviada ao empresário do ${player.name}`});
    } catch(err) {
      res.status(500).json({ message: "Ocorreu um erro ao processar sua solicitação!" });
    }
  }

  static async concludeLoan (req, res) {
    const id = req.params.id;

    /* check if is a valid id */
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: "Id Inválido!" });
      return;
    }

    /* check if player exists */
    const player = await Player.findById(id).lean();

    if (!player) {
      res.status(422).json({ message: "Jogador não cadastrado!" });
      return;
    }

    const token = getToken(req);
    const team = await getTeamByToken(token);

    /* check if team exists */
    if (!team) {
      res.status(422).json({ message: "Você precisa ter um clube para finalizar empréstimo!" });
      return;
    }

    /* check if player belong to this team */
    if(!player.team._id.equals(team.id)) {
      res.status(422).json({ message: "Você só pode finalizar os empréstimos de jogadores do seu time!" });
      return;
    }

    /* check if player has some possible borrower */
    if (!player.borrower) {
      res.status(422).json({ message: "O jogador ainda não tem nenhum time interessado!" });
      return;
    }

    /* check if player has already been lent */
    if(!player.available) {
      res.status(422).json({ message: `O jogador já foi emprestado ao ${player.borrower.name} de(a) ${player.borrower.country}!` });
      return;
    }

    player.available = false;

    try {
      await Player.findByIdAndUpdate(id, player);
      res.status(200).json({ 
        message: `Jogador ${player.name} foi emprestado ao Time ${player.borrower.name} de(a) ${player.borrower.country}`,
      });
    } catch (err) {
      res.status(500).json({ message: "Ocorreu um erro ao processar sua solicitação" });
    }
  }

  static async quitLoan (req, res) {
    const id = req.params.id;
    
    /* check if is a valid id */
    if(!ObjectId.isValid(id)) {
      res.status(422).json({ message: "Id Inválido!" });
      return;
    }

    /* check if player exists */
    const player = await Player.findById(id);
    if(!player) { 
      res.status(422).json({ message: "Este jogador não está cadastrado!" });
      return;
    }

    const token = getToken(req);
    const team = await getTeamByToken(token);

    /* check if player belongs to this team */
    if (player.team._id.equals(team._id)) {
      res.status(422).json({ message: "Você não pode desistir de um empréstimo de um jogador do seu time!" });
      return;
    }

    /* check if player's team has already accept a loan request */
    if (player.borrower) {
      if(player.borrower._id.equals(team._id) && player.available == false) {
        res.status(422).json({ message: `O time ${player.team.name} já aceitou sua proposta de empréstimo!` });
        return;
      } else if (player.available == false){
        res.status(422).json({ message: `O time ${player.team.name} já aceitou uma proposta de empréstimo!` });
        return;
      }
    }

    if(player.borrower._id.equals(team._id)) {
      player.borrower = null;
    } else {
      res.status(422).json({ message: "Você não está negociando empréstimo com este jogador!" });
      return;
    }  

    await Player.findByIdAndUpdate(id, player);
    res.status(200).json({ message: "Você desistiu deste negócio!" });
  }

  static async decline (req, res) {
    const id = req.params.id;

    /* check if is a valid id */
    if(!ObjectId.isValid(id)) {
      res.status(422).json({ message: "Id Inválido"});
      return;
    }

    /* check if player exists */
    const player = await Player.findById(id);
    if (!player) {
      res.status(422).json({ message: "Jogador não encontrado"});
      return;
    }

    const token = getToken(req);
    const team = await getTeamByToken(token);

    /* check if player belongs to this team */
    if (!player.team._id.equals(team._id)) {
      res.status(422).json({ message: "Você só pode recusar as ofertas por jogadores do seu time!" });
      return;
    }

    /* check if player has a possible borrower */
    if (!player.borrower) {
      res.status(422).json({ message: "Este jogador não possui interssados!" });
      return;
    }

    /* check if has already accept */
    if (!player.available) {
      res.status(422).json({ message: "Você já aceitou uma proposta de empréstimo para este jogador!" });
    }

    const borrowerTeam = player.borrower.name;

    player.borrower = null;

    await Player.findByIdAndUpdate(id, player);
    res.status(200).json({ message: `Você recusou a proposta do ${borrowerTeam}`});
  }

  static async deletePlayer (req, res) {
    const id = req.params.id;

    /* check if is a valid id */
    if(!ObjectId.isValid(id)) {
      res.status(422).json({ message: "ID Inválido!" });
      return;
    }

    /* check if player exists */
    const player = await Player.findById(id);
    if (!player) {
      res.status(422).json({ message: "Jogador não cadastrado!" });
      return;
    }

    /* check if player belgons to this team */
    const token = getToken(req);
    const team = await getTeamByToken(token);

    if (!player.team._id.equals(team._id)) {
      res.status(422).json({ message: "Você só pode excluir jogadores do seu time!" });
      return;
    }

    if(player.borrower) {
      player.borrower = null;
    }

    await Player.findByIdAndDelete(id);
    res.status(200).json({ message: "Jogador excluído com sucesso!" });
  }

  static async getLoanRequests (req, res) {
    const token = getToken(req);
    const team = await getTeamByToken(token);

    if(!team) {
      res.status(422).json({ message: "Você precisa estar logado para ver suas solicitações de empréstimo "});
      return;
    }

    try {
      const players = await Player.find({"borrower._id": team._id, available: true}).lean();
      res.status(200).json({ players: players });
    }catch (err) {
      res.status(500).json({ message: "Não foi possível realizar a sua solicitação" });
      return;
    }
  }

  static async getMyLoanRequests (req, res) {
    const token = getToken(req);
    const team = await getTeamByToken(token);

    if(!team) {
      res.status(422).json({ message: "Você precisa ter um time para verificar suas solicitações" });
      return;
    }

    const players = await Player.find({ ["team._id"]: team._id, available: true });
    const myLoanRequests = players.filter(player => player.borrower !== undefined && player.borrower !== null);

    if(myLoanRequests.length === 0) {
      res.status(200).json({ message: "Você não possui nenhum jogador avançando em negociações" });
      return;
    }

    res.status(200).json({ players: myLoanRequests });
    return;
  }

  static async getMyConcludedLoans (req, res) {
    const token = getToken(req);
    const team = await getTeamByToken(token);

    if (!team) {
      res.status(422).json({ message: "Você precisa ter um clube para consultar!" });
      return;
    }

    const players = await Player.find({ ["team._id"]: team._id, available: false });

    if (players.length === 0) {
      res.status(200).json({ message: "Você não possui nenhum jogador empresatado!" });
      return;
    }

    res.status(200).json({ players: players });
  }

  static async getMyLoanPlayers (req, res) {
    const token = getToken(req);
    const team = await getTeamByToken(token);

    if (!team) {
      res.status(422).json({ message: "Você precisa ter um clube para consultar!" });
      return;
    }

    const players = await Player.find({ ["borrower._id"]: team._id, available: false });

    if (players.length === 0) {
      res.status(200).json({ message: "Você não possui nenhum jogador contratado!" });
      return;
    }

    res.status(200).json({ players: players });
  }
};