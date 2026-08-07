//server.js est le fichier qui lance réellement ton backend.
//Il fait trois choses :

//1. Charge les variables du fichier .env
//2. Importe l’application Express définie dans app.js
//3. Démarre le serveur sur le port 5000

require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});