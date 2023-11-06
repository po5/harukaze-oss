import { fetchLinkShownPageInfos, PageInfo, PageOrder as PageOrder } from '../models/pages.model'

let linkShownPages: PageInfo[] = []

/**
 * Refreshes all link-shown pages
 */
export async function refreshLinkShownPages() {
	// Fetch all link-shown pages
	linkShownPages = await fetchLinkShownPageInfos(false, 0, 999, PageOrder.TITLE_ASC)
}

/**
 * Returns all link-shown pages
 * @returns All link-shown pages
 */
export function getLinkShownPages(): PageInfo[] {
	return linkShownPages
}