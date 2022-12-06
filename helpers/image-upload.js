const multer = require("multer");
const path = require("path");

/* destination to store */
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = "";

    if(req.baseUrl.includes("teams")) {
      folder = "teams";
    } else if (req.baseUrl.includes("players")) {
      folder = "players";
    }

    cb(null, `public/images/${folder}`);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + String(Math.floor(Math.random() * 10000)) + path.extname(file.originalname));
  },
});

const imageUpload = multer({
  storage: imageStorage,
  fileFilter(req, file, cb) {
    if(!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb (new Error("Por favor envie imagens no formato JPG, JPEG, PNG!"));
    }
    cb(undefined, true);
  },
});

module.exports = { imageUpload };