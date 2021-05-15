const prisma = require('../db.js');

/**
 * Fetches all contributors.
 */
async function fetchContributors() {
    let admins = await prisma.user.findMany({where: { role: prisma.Role.ADMIN }});
    let contributors = await prisma.user.findMany({where: { role: prisma.Role.CONTRIBUTOR }});
    return contributors.concat(admins);
}

async function createUser(name, password, description, role) {

}

module.exports.fetchContributors = fetchContributors;