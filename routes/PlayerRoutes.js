const router = require("express").Router();
const PlayerController = require("../controllers/PlayerController");

/* helpers */
const verifyToken = require("../helpers/verify-token");
const { imageUpload } = require("../helpers/image-upload");

router.post("/register", verifyToken, imageUpload.single("image"), PlayerController.registerPlayer);
router.patch("/edit/:id", verifyToken, imageUpload.single("image"), PlayerController.editPlayer);
router.get("/loan/players", verifyToken, PlayerController.getLoanRequests);
router.get("/loan/myplayers", verifyToken, PlayerController.getMyLoanRequests);
router.get("/concludedloans", verifyToken, PlayerController.getMyConcludedLoans);
router.get("/loan/newplayers", verifyToken, PlayerController.getMyLoanPlayers);
router.patch("/loan/:id", verifyToken, PlayerController.loanRequest);
router.patch("/loan/quit/:id", verifyToken, PlayerController.quitLoan);
router.patch("/concludeloan/:id", verifyToken, PlayerController.concludeLoan);
router.patch("/concludeloan/decline/:id", verifyToken, PlayerController.decline);
router.patch("/edit/:id", verifyToken, imageUpload.single("image"), PlayerController.editPlayer);
router.get("/teamplayers",verifyToken, PlayerController.getPlayersByTeam);
router.get("/", PlayerController.getPlayers);
router.get("/:id", PlayerController.getPlayerById);
router.delete("/delete/:id", verifyToken, PlayerController.deletePlayer);

module.exports = router;