/* external modules */
const express = require("express");
const cors = require("cors");

const app = express();
const conn = require("./db/conn").run;

/* importing routers */
const TeamRoutes = require("./routes/TeamRoutes");
const PlayerRoutes = require("./routes/PlayerRoutes");

/* config JSON reponse */
app.use(express.urlencoded({
  extended: true,
}))

app.use(express.json());

/* solve CORS */
app.use(cors({ credentials: true, origin: "http://localhost:3000"}));

/* public folder for images */
app.use(express.static("public"));

/* routes */
app.use("/teams", TeamRoutes);
app.use("/players", PlayerRoutes);

app.listen(5000);