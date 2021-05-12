const prisma = require('../db.js');

/**
 * Fetches all posts.
 */
async function fetchPosts() {
    return await prisma.post.findMany({
        include: {
            author: {
                // manually select author object contents as to not expose any sensitive information
                select: {
                    name: true
                }
            }
        }
    });
}

/**
 * Fetches a post by it's slug
 * @param {string} slug
 */
async function fetchPostBySlug(slug) {
    return await prisma.post.findFirst({where:{slug: slug}, include:{author:{select:{name: true}}}});
}

module.exports.fetchPosts = fetchPosts;
module.exports.fetchPostBySlug = fetchPostBySlug;