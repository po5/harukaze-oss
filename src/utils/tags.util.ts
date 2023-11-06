import { fetchMediaTags } from 'models/media.model'
import { setToArray } from 'utils/misc.util'
import { fetchPostTags } from 'models/posts.model'

/**
 * An object containing tags and their usage counts.
 * Key: The tag.
 * Value: The tag's usage count.
 */
export type TagsAndUsages = { [key: string]: number }

/**
 * The current media tags and their usage counts
 */
let mediaTags: TagsAndUsages = {}
/**
 * The current post tags and their usage counts
 */
let postTags: TagsAndUsages = {}

/**
 * Refreshes all tags in memory
 */
export async function refreshTags() {
    // Fetch all media tags
    let mediaRows = await fetchMediaTags()

    // Enumerate and remove duplicates
    let tmpMediaTags: TagsAndUsages = {}
    for(const row of mediaRows) {
        let arr = setToArray(row.tags)

        for(const tag of arr) {
            if(tag in tmpMediaTags)
                tmpMediaTags[tag]++
            else
                tmpMediaTags[tag] = 1
        }
    }

    // Sort by name length
    tmpMediaTags = Object.keys(tmpMediaTags)
        .sort((a, b) => a.length - b.length)
        .reduce((res: any, key) => {
            res[key] = tmpMediaTags[key]
            return res
        }, {})

    // Store media tags
    mediaTags = tmpMediaTags

    // Fetch all post tags
    let postRows = await fetchPostTags()

    // Enumerate and remove duplicates
    let tmpPostTags: TagsAndUsages = {}
    for(const row of postRows) {
        let arr = setToArray(row.tags)

        for(let tag of arr) {
            if(tag in tmpPostTags)
                tmpPostTags[tag]++
            else
                tmpPostTags[tag] = 1
        }
    }

    // Sort by name length
    tmpPostTags = Object.keys(postTags)
        .sort((a, b) => a.length - b.length)
        .reduce((res: any, key) => {
            res[key] = postTags[key]
            return res
        }, {})

    // Store post tags
    postTags = tmpPostTags
}

/**
 * Returns all media tags
 * @returns All media tags
 */
export function getMediaTags(): TagsAndUsages {
    return mediaTags
}

/**
 * Returns all media tags containing the provided substring
 * @param substr The substring to check for
 * @returns All tags containing the provided substring
 */
export function getMediaTagsContaining(substr: string): TagsAndUsages {
    let str = substr.trim().toLowerCase()
    let tags: TagsAndUsages = {}
    let tagNames = Object.keys(mediaTags)
    for(let tag of tagNames)
        if(tag.includes(str))
            tags[tag] = mediaTags[tag]
    
    return tags
}

/**
 * Returns the amount of uses a media tag has
 * @param tag The tag to check
 * @returns The amount of uses the specified tag has
 */
export function getMediaTagUseCount(tag: string): number {
    return tag in mediaTags ? mediaTags[tag] : 0
}

/**
 * Returns all post tags
 * @returns All post tags
 */
export function getPostTags(): TagsAndUsages {
    return postTags
}

/**
 * Returns all post tags containing the provided substring
 * @param substr The substring to check for
 * @returns All tags containing the provided substring
 */
export function getPostTagsContaining(substr: string): TagsAndUsages {
    let str = substr.trim().toLowerCase()
    let tags: TagsAndUsages = {}
    let tagNames = Object.keys(postTags)
    for(let tag of tagNames)
        if(tag.includes(str))
            tags[tag] = postTags[tag]

    return tags
}

/**
 * Returns the amount of uses a post tag has
 * @param tag The tag to check
 * @returns The amount of uses the specified tag has
 */
export function getPostTagUseCount(tag: string): number {
    return tag in postTags ? postTags[tag] : 0
}

// Refresh tags every minute
setInterval(async () => {
    try {
        await refreshTags()
    } catch(err) {
        console.error('FAILED TO REFRESH TAGS:')
        console.error(err)
    }
}, 60_000)