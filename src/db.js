const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();
// expose the role enum via the prisma client
prisma.Role = Role;

module.exports = prisma;