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
                    },
                    {
                        title: "obiligatory latin trash by and for soydevs",
                        slug: slugify("obiligatory latin trash by and for soydevs"),
                        content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi pretium sem vitae ex tincidunt, quis consectetur nisi dignissim. Donec maximus purus a augue faucibus, ac lobortis nisl ullamcorper. In hac habitasse platea dictumst. Cras pulvinar tempor bibendum. Sed sit amet arcu fermentum, convallis dui non, euismod ex. Nunc auctor magna euismod nunc suscipit ornare. Morbi nec lectus velit. Maecenas volutpat metus ante, a pretium nibh ultricies vel. Vestibulum vitae neque metus.\n\nProin cursus sem nec ex sodales faucibus. Donec facilisis augue vel volutpat sollicitudin. Duis fermentum felis tempor nunc suscipit euismod. Aenean nunc diam, pulvinar sit amet dignissim non, porttitor id leo. Phasellus fringilla, massa sit amet interdum molestie, neque libero imperdiet enim, quis volutpat nibh est posuere felis. In quis tincidunt magna, quis rutrum massa. Morbi lobortis urna sed volutpat posuere. Maecenas gravida neque nec ipsum porta, eget malesuada purus convallis. Nulla convallis tellus at nisi ultrices laoreet. Aliquam at massa urna. Sed scelerisque erat et sagittis semper. Proin ut nibh semper, ultricies neque eget, ultrices mi. Phasellus semper malesuada turpis, molestie rhoncus odio aliquet eu. Aenean mollis turpis at ipsum malesuada suscipit.\n\nQuisque cursus ante at quam eleifend fermentum. Aliquam condimentum semper tellus ac dignissim. Morbi at ex luctus, rutrum ex vitae, interdum dolor. Mauris pretium ligula ac imperdiet cursus. Sed vestibulum metus consectetur sem convallis, eget suscipit ligula dignissim. In ut dui aliquam, suscipit dui et, ultrices elit. Aliquam placerat metus non nunc pharetra, sed posuere lectus auctor. Nullam erat metus, gravida ac consequat eget, dictum et odio.\n\nNulla facilisi. Donec commodo vel nunc sit amet imperdiet. Proin et nulla diam. Nam a tincidunt lectus, vel aliquam sem. Nunc ut vehicula sem. Mauris suscipit bibendum elit, vel sollicitudin nisl venenatis vitae. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut vitae lorem nec nisl suscipit ultricies sit amet at enim.\n\nIn faucibus leo non ligula scelerisque fringilla ut eget leo. Morbi erat enim, finibus id fermentum eu, gravida ac justo. Praesent venenatis massa vitae eros placerat, blandit finibus massa vestibulum. Praesent venenatis dignissim sapien. Nunc eget viverra lectus. Maecenas ultricies urna velit, ac convallis tellus fringilla convallis. Vivamus vitae dapibus sem. Quisque ac gravida sapien. Integer non mollis ligula. Pellentesque tristique risus dictum augue euismod, vitae lobortis odio bibendum."
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