const prisma = require('../db.js');
const slugify = require('slugify');

/**
 * Fetches all posts
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 */
async function fetchPosts(offset, limit) {
    return await prisma.post.findMany({
        include: {
            author: {
                // manually select author object contents as to not expose any sensitive information
                select: {
                    name: true
                }
            }
        } // Not actually sure if this is a thing you can do in prisma, but yeah this is what you need to do however they do it
    }).offset(offset).limit(limit);
}

/**
 * Fetches a post by it's slug
 * @param {string} slug
 */
async function fetchPostBySlug(slug) {
    return await prisma.post.findFirst({where:{slug: slug}, include:{author:{select:{name: true}}}});
}

/**
 * Creates a post
 * @param {number} authorId 
 * @param {string} title 
 * @param {string} content 
 */
async function createPost(authorId, title, content) {
    const post = await prisma.post.create({
        data: {
            title: title,
            slug: slugify(title),
            content: content,
            author: {
                connect: { id: authorId }
            }
        }
    });

    console.log(post);
}

module.exports.fetchPosts = fetchPosts;
module.exports.fetchPostBySlug = fetchPostBySlug;
module.exports.createPost = createPost;