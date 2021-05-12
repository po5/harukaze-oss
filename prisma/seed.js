const { PrismaClient, Role } = require('@prisma/client');
const slugify = require('slugify');
const prisma = new PrismaClient();

async function main() {
    const gutsy = await prisma.user.upsert({
        where: {name: "gutsybird"},
        update: {},
        create: {
            name: "gutsybird",
            description: "i make coole drawings!",
            role: Role.ADMIN,
            password: "abc",
            posts: {
                create: [
                    {
                        title: "why incest is wincest!!",
                        content: "do i really have to explain this?",
                        slug: slugify("why incest is wincest!!")
                    }
                ]
            }
        }
    });

    const tubtub = await prisma.user.upsert({
        where: {name: "TubTub"},
        update: {},
        create: {
            name: "TubTub",
            description: "I AM STUCK AS A FROG PLZ HELP ME",
            role: Role.CONTRIBUTOR,
            password: "efd",
            posts: {
                create: [
                    {
                        title: "is coffee good for you?",
                        content: "hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic hot pic ",
                        slug: slugify("is coffee good for you?")
                    }
                ]
            }
        }
    });

    const lilyhops = await prisma.user.upsert({
        where: {name: "Lily Hops"},
        update: {},
        create: {
            name: "Lily Hops",
            description: "be my big brother?",
            role: Role.USER,
            password: "aaaa"
        }
    });

    console.log({gutsy, tubtub, lilyhops});
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  });