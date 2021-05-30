const prisma = require('../db.js')
const slugify = require('slugify')

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
    })

    console.log(post)
}

/**
 * Fetches all posts
 * @param {number} offset The offset to return results
 * @param {number} limit The amount of results to return
 * @return {Array<import('@prisma/client').Post>} All posts
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
        },
        skip: offset,
        take: limit
    })
}

/**
 * Fetches a post by it's slug
 * @param {string} slug
 * @returns {import('@prisma/client').Post} The post
 */
async function fetchPostBySlug(slug) {
    return await prisma.post.findFirst({
        where: { slug: slug },
        include: {
            author: {
                select: { name: true }
            },
            comments:{}
        }
    })
}

/**
 * Returns the total amount of posts
 * @returns {number} The total amount of posts
 */
async function fetchPostsCount() {
    return await prisma.post.count()
}

/* Export functions */
module.exports.createPost = createPost
module.exports.fetchPosts = fetchPosts
module.exports.fetchPostBySlug = fetchPostBySlug
module.exports.fetchPostsCount = fetchPostsCount