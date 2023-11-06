import { deletePostsByIds } from 'models/posts.model'
import { CommentType, deleteCommentsByPostIds } from 'models/comments.model'

/**
 * Deletes posts and dependents (like comments) by post IDs
 * @param ids The post IDs
 */
export async function deletePostsAndDependentsByIds(ids: number[]) {
    await deletePostsByIds(ids)
    await deleteCommentsByPostIds(ids, CommentType.POST)
}