const router = require("express").Router();
const TeamController = require("../controllers/TeamController");

/* helpers */
const verifyToken = require("../helpers/verify-token");
const { imageUpload } = require("../helpers/image-upload");

router.post("/register", TeamController.registerTeam);
router.post("/login", TeamController.login);
router.get("/checkteam", TeamController.checkTeam);
router.get("/:id", TeamController.getTeamById);
router.patch("/edit/:id", verifyToken, imageUpload.single("image"), TeamController.editTeam)

module.exports = router; 