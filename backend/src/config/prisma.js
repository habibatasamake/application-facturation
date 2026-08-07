const { PrismaClient } = require("@prisma/client");;

//nouveau client prisma pour interagir avec la base de données
const prisma = new PrismaClient();

module.exports = prisma;