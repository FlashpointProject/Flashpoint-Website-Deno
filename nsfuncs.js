import { contentType } from 'jsr:@std/media-types@1.1.0';
import { format } from 'jsr:@std/fmt@1.0.8/bytes';
import { GameSearchSortable, GameSearchDirection, newSubfilter } from 'npm:@fparchive/flashpoint-archive';
import { Marked } from 'npm:marked@17.0.1';
import { markedEmoji } from 'npm:marked-emoji@2.0.2';

import * as utils from './utils.js';

const videoExp = /\.(?:mp4|webm)$/;
const youtubeExp = /^https?:\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([a-z0-9_-]{11})(?:[?&]list=([a-z0-9_-]{34}))?/i;
const twitterExp = /^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(.*?)\/status\/([0-9]+)/;
const idExp = /^[a-z\d]{8}-[a-z\d]{4}-[a-z\d]{4}-[a-z\d]{4}-[a-z\d]{12}$/;

// Prevent language definitions from being consumed when parsing codeblocks
const codeRenderer = token => {
	const text = (token.lang != '' ? token.lang + '\n' : '') + token.text;
	return utils.buildHtml(templates['news'].entry_codeblock, { text: utils.sanitizeInject(text) });
};

// Configure markdown parser for different types of news
const discordMarked = new Marked().use({
	breaks: true,
	renderer: { code: codeRenderer },
}, markedEmoji({
	emojis: {
		AngryFaic: 'AngryFaic.png',
		cool_crab: 'cool_crab.png',
		flashpoint: 'flashpoint.png',
		futurewave: 'futurewave.png',
		K_Meleon: 'K_Meleon.png',
		newgrounds: 'newgrounds.png',
		Patrick: 'Patrick.png',
		rip: 'rip.png',
		Ruffle: 'Ruffle.png',
		Squeak: 'Squeak.png',
		SqueakpointLogoTransparentBG: 'SqueakpointLogoTransparentBG.png',
		TankYeah: 'TankYeah.png',
		Thonk: 'Thonk.png',
		zuma: 'zuma.png',
	},
	renderer: token => `<img class="fp-news-discord-emoji" src="/images/news/discord/emojis/${token.emoji}" alt="${token.name}">`,
}));
const articleMarked = new Marked().use({
	breaks: true,
	renderer: {
		image: token => {
			// Create caption out of alt text
			const caption = token.text != '' ? `<div class="fp-news-article-caption">${articleMarked.parseInline(token.text)}</div>` : '';

			// If the image URL is a video file, create a video embed
			const videoMatch = token.href.match(videoExp);
			if (videoMatch !== null)
				return utils.buildHtml(templates['news'].entry_video, {
					file: token.href,
					type: contentType(videoMatch[0]),
				}) + '\n' + caption;

			// If the image URL is a YouTube link, create a YouTube embed
			const youtubeMatch = token.href.match(youtubeExp);
			if (youtubeMatch !== null)
				return utils.buildHtml(templates['news'].entry_youtube, {
					id: youtubeMatch[1],
					listId: youtubeMatch[2] !== undefined ? `?list=${youtubeMatch[2]}` : '',
				}) + '\n' + caption;

			// If the image URL is a Twitter link, create a Twitter embed
			const twitterMatch = token.href.match(twitterExp);
			if (twitterMatch !== null)
				return utils.buildHtml(templates['news'].article_twitter, {
					handle: twitterMatch[1],
					id: twitterMatch[2],
					caption: caption,
				});

			// Otherwise, create an image or set of images
			return utils.buildHtml(templates['news'].article_imageset, {
				images: token.href.split('|').map(file => utils.buildHtml(templates['news'].article_image, { file: file })).join('\n'),
				caption: caption,
			});
		},
		code: codeRenderer,
	},
});

export const namespaceFunctions = {
	'shell': (url, selectedLang) => {
		const langParams = new URLSearchParams(URL.parse(url)?.searchParams);
		const langButtons = [];
		const langMetas = [];
		for (const lang in locales) {
			// Build language select
			langParams.set('lang', lang);
			langButtons.push(`<a class="fp-shell-sidebar-button fp-shell-button fp-shell-alternating" href="?${langParams.toString()}">${locales[lang].name}</a>`);

			// Build Open Graph locale definitions
			if (lang == selectedLang)
				langMetas.unshift(`<meta property="og:locale" content="${lang.replace('-', '_')}">`);
			else
				langMetas.push(`<meta property="og:locale:alternate" content="${lang.replace('-', '_')}">`);
		}

		return {
			'OG_LOCALES': langMetas.join('\n'),
			'LANGUAGE_SELECT': langButtons.join('\n'),
		};
	},
	'news': (url, lang, defs) => {
		const subpage = utils.trimSlashes(url.pathname).substring(5);
		if (subpage == '') {
			let filter = url.searchParams.get('filter');
			if (filter !== null && !['article', 'video', 'changelog'].some(validFilter => filter == validFilter))
				filter = null;

			// Prepare news index entries
			const newsIndexEntryArr = [];
			for (const newsEntry of newsInfo) {
				if (filter !== null && newsEntry.type != filter)
					continue;

				// Build news index entry HTML
				newsIndexEntryArr.push(utils.buildHtml(templates['news'].index_entry, Object.assign({}, defs, {
					id: newsEntry.id,
					title: newsEntry.title,
					author: newsEntry.author,
					date: newsEntry.date?.length >= 10 ? new Date(newsEntry.date).toLocaleDateString(lang, { timeZone: 'UTC' }) : '',
				})));
			}

			// Get news index header text
			let entriesHeaderDef = 'All_News';
			if (filter !== null) {
				switch (filter) {
					case 'article': entriesHeaderDef = 'All_Articles'; break;
					case 'video': entriesHeaderDef = 'All_Videos'; break;
					case 'changelog': entriesHeaderDef = 'All_Changelogs'; break;
				}
			}

			// Build news index categories HTML
			const getNewsButton = (type, def) => filter !== type ? `<a href="/news${type ? '?filter=' + type : ''}">${defs[def]}</a>` : `<b>${defs[def]}</b>`;
			const newsIndexCategoriesHtml = utils.buildHtml(templates['news'].index_categories, Object.assign({}, defs, {
				allNewsButton: getNewsButton(null, 'All_News'),
				articlesButton: getNewsButton('article', 'Articles'),
				videosButton: getNewsButton('video', 'Videos'),
				changelogsButton: getNewsButton('changelog', 'Changelogs'),
			}));

			// Build news index HTML
			const newsIndexHtml = utils.buildHtml(templates['news'].index, Object.assign({}, defs, {
				categories: newsIndexCategoriesHtml,
				entriesHeader: defs[entriesHeaderDef],
				entries: newsIndexEntryArr.join('\n'),
			}));
			return { content: newsIndexHtml };
		}
		else if (subpage == 'discord') {
			const years = [...new Set(discordInfo.map(discordEntry => discordEntry.posted.substring(0, 4)))].toSorted();
			let filter = url.searchParams.get('filter');
			if (!years.includes(filter))
				filter = null;

			// Build navigation buttons
			const yearButtons = [filter === null ? `<b>${defs['All_Posts']}</b>` : `<a href="/news/discord">${defs['All_Posts']}</a>`]
				.concat(years.map(year => year == filter ? `<b>${year}</b>` : `<a href="/news/discord?filter=${year}">${year}</a>`))
				.map(yearButton => `<span class="fp-news-index-category">${yearButton}</span>`);

			// Prepare Discord messages
			const newsDiscordMessageArr = [];
			for (const discordEntry of discordInfo) {
				if (filter !== null && !discordEntry.posted.startsWith(filter))
					continue;

				// Build formatted date strings
				const postedDate = utils.getFormattedDate(discordEntry.posted, lang) ?? defs['Unknown_Date'];
				const editedDate = utils.getFormattedDate(discordEntry.edited, lang);

				// Parse Discord message and build info strings
				const content = discordMarked.parse(Deno.readTextFileSync(`news/discord/${discordEntry.id}.txt`)).trim();
				const byline = utils.buildStringFromParams(
					`${discordEntry.circa ? 'Discord_Byline2' : 'Discord_Byline1'},<b>,"${discordEntry.author}","${postedDate}"`, defs
				);
				const edited = editedDate === null ? '' : '<span class="fp-news-discord-edited">' + (
					discordEntry.posted != discordEntry.edited
						? utils.buildStringFromParams(`Discord_Edited2,"${editedDate}"`, defs)
						: defs['Discord_Edited1']
				) + '</span>';

				// Prepare message attachments
				const attachments = [];
				for (const attachment of discordEntry.attachments) {
					const fileExt = attachment.path && attachment.path.substring(attachment.path.lastIndexOf('.'));
					let image = '';
					let name = attachment.name ?? 'unknown' + (fileExt ?? '');
					if (attachment.path !== null) {
						// If attachment is an image, display it
						if (['.png', '.jpg', '.gif'].some(ext => ext == fileExt))
							image = `<img class="fp-news-discord-attachment-image" src="${attachment.path}">`;

						name = `<a href="${attachment.path}">${name}</a>`;
					}

					// Build message attachment HTML
					attachments.push(utils.buildHtml(templates['news'].discord_attachment, {
						image: image,
						name: name,
						lost: attachment.path === null ? `<span class="fp-news-discord-attachment-lost">${defs['Missing']}</span>` : '',
						size: attachment.size !== null ? format(attachment.size, { locale: lang }) : '??? kB',
					}));
				}

				// Build Discord message HTML
				newsDiscordMessageArr.push(utils.buildHtml(templates['news'].discord_message, Object.assign({}, defs, {
					id: discordEntry.id,
					byline: byline,
					content: content,
					attachments: attachments.join('\n'),
					edited: edited,
					original: discordEntry.original,
				})));
			}

			// Build Discord archive HTML
			const newsDiscordHtml = utils.buildHtml(templates['news'].discord, Object.assign({}, defs, {
				yearButtons: yearButtons.join('\n'),
				messages: newsDiscordMessageArr.join('\n'),
			}));
			return {
				Title: defs['Discord_Archive'],
				content: newsDiscordHtml
			};
		}
		else {
			// Find news entry
			const newsEntry = newsInfo.find(newsEntry => subpage == newsEntry.id);
			if (!newsEntry) throw new utils.NotFoundError(url, lang);

			// Get text of news entry and sanitize if not an article
			const newsEntryPath = `news/${newsEntry.id}.txt`;
			let rawText = utils.getPathInfo(newsEntryPath)?.isFile
				? Deno.readTextFileSync(newsEntryPath)
				: '';
			if (newsEntry.type != 'article')
				rawText = utils.sanitizeInject(rawText, { '&': '&amp;' });

			// Parse text of news entry based on its type
			let content = '';
			switch (newsEntry.type) {
				case 'article': {
					content = articleMarked.parse(rawText).trim();
					break;
				}
				case 'video': {
					if (newsEntry.source === null) {
						const videoMatch = newsEntry.link.match(videoExp);
						if (videoMatch !== null)
							content = utils.buildHtml(templates['news'].entry_video, {
								file: newsEntry.link,
								type: contentType(videoMatch[0]),
							});
					}
					else if (newsEntry.source == 'YouTube') {
						const youtubeMatch = newsEntry.link.match(youtubeExp);
						if (youtubeMatch !== null)
							content = utils.buildHtml(templates['news'].entry_youtube, {
								id: youtubeMatch[1],
								listId: youtubeMatch[2] !== undefined ? `?list=${youtubeMatch[2]}` : '',
							});
					}
					break;
				}
				case 'changelog': {
					content = utils.sanitizeInject(rawText).replace(/(?:^ +| {2,}|\n+|\t+)/gm, match => {
						const char = match[0];
						if (char == ' ')
							return '&nbsp;'.repeat(match.length);
						if (char == '\n')
							return '<br>'.repeat(match.length);
						if (char == '\t')
							return '&nbsp;'.repeat(match.length * 4);
					});
					break;
				}
			}

			// Build byline parameters
			let bylineSource = 'Entry_Byline1';
			let bylineParams = ',<b>,author,date'
			if (newsEntry.source) {
				bylineParams = `,"${newsEntry.source}"` + bylineParams;
				if (newsEntry.link) {
					bylineSource = 'Entry_Byline3';
					bylineParams = `,<a href="${newsEntry.link}">` + bylineParams;
				}
				else
					bylineSource = 'Entry_Byline2';
			}
			bylineParams = 'byline' + bylineParams;

			// Build news entry HTML
			const newsEntryHtml = utils.buildHtml(templates['news'].entry, Object.assign({}, defs, {
				title: newsEntry.title,
				byline: utils.buildStringFromParams(bylineParams, {
					byline: defs[bylineSource],
					author: newsEntry.author,
					date: utils.getFormattedDate(newsEntry.date, lang) ?? defs['Unknown_Date'],
				}),
				type: newsEntry.type,
				content: content,
			}));
			return {
				Title: newsEntry.title,
				Author: newsEntry.author,
				content: newsEntryHtml
			};
		}
	},
	'faq': (_, lang) => ({
		grandTotal: searchStats.total.toLocaleString(lang),
		lastUpdated: new Intl.DateTimeFormat(lang, {
			dateStyle: 'long',
			timeZone: 'UTC',
		}).format(new Date(searchStats.lastUpdated)),
	}),
	'search': async (url, lang, defs) => {
		const params = url.searchParams;
		const newDefs = Object.assign({}, defs, {
			ascSelected: params.get('dir') == 'asc' ? ' selected' : '',
			descSelected: params.get('dir') == 'desc' ? ' selected' : '',
			nsfwChecked: params.get('nsfw') == 'true' ? ' checked' : '',
			anyChecked: params.get('any') == 'true' ? ' checked' : '',
			resultsPerPage: config.pageSize.toLocaleString(lang),
		});

		// Populate "sort by" dropdown
		const sortFields = [];
		for (const field in searchInfo.sort) {
			const selected = params.get('sort') == field ? ' selected' : '';
			sortFields.push(`<option value="${field}"${selected}>${searchInfo.sort[field]}</option>`);
		}
		newDefs.sortFields = sortFields.join('\n');

		let searchInterface, searchFilter, invalid = false;
		if (params.get('advanced') == 'true') {
			// Parse Advanced Mode query string
			const fields = params.getAll('field');
			const filters = params.getAll('filter');
			const values = params.getAll('value');
			if (fields.length > 0 && fields.length == filters.length && filters.length == values.length) {
				// Initialize database search filter object
				searchFilter = newSubfilter();
				for (let i = 0; i < fields.length; i++) {
					const field = fields[i];
					const filter = filters[i];
					const value = values[i];
					// Invalidate query if any field or filter definition is blank
					// Blank value definitions can be useful however, and are considered valid
					if (field == '' || filter == '') {
						invalid = true;
						break;
					}

					// Populate search filter by comparing query parameters to search.json definitions
					let success = false;
					for (const type in searchInfo.field) {
						if (!Object.hasOwn(searchInfo.field[type], field)
						 || !Object.hasOwn(searchInfo.filter[type], filter)
						 || (type == 'string' && Object.hasOwn(searchInfo.value, field) && !Object.hasOwn(searchInfo.value[field], value)))
							continue;

						if (type == 'string')
							searchFilter[filter][field] = (searchFilter[filter][field] ?? []).concat(value);
						else if (type == 'date')
							searchFilter[filter][field] = value;
						else if (type == 'number') {
							const parsedValue = parseInt(value, 10);
							if (!isNaN(parsedValue) && parsedValue >= 0)
								searchFilter[filter][field] = parsedValue;
							else {
								invalid = true;
								break;
							}
						}

						success = true;
						break;
					}

					// Invalidate query if any parameter is invalid
					if (!success) {
						invalid = true;
						break;
					}
				}

				// Enable Match Any if desired
				if (params.get('any') == 'true')
					searchFilter.matchAny = true;
			}
			else if (fields.length > 0 || filters.length > 0 || values.length > 0)
				invalid = true;

			// Build Advanced Mode search interface HTML
			searchInterface = utils.buildHtml(templates['search'].mode_advanced, newDefs);
		}
		else {
			// Parse Simple Mode query string
			const searchQuery = params.get('query');
			if (searchQuery !== null)
				searchFilter = fp.parseUserSearchInput(searchQuery).search.filter;

			// Build Simple Mode search interface HTML
			newDefs.searchQuery = utils.sanitizeInject(searchQuery ?? '');
			searchInterface = utils.buildHtml(templates['search'].mode_simple, newDefs);
		}

		let searchContent = '';
		if (invalid)
			// If search query is invalid, don't attempt to search
			searchContent = utils.buildHtml(templates['search'].navigation, Object.assign(newDefs, {
				totalResults: '0',
				resultsPerPageHidden: ' hidden',
				searchResults: '',
				topPageButtons: '',
				bottomPageButtons: '',
			}));
		else if (searchFilter !== undefined) {
			// Initialize database search query object
			const search = fp.parseUserSearchInput('').search;
			search.limit = config.pageSize;

			// If NSFW filter needs to be active, add a subfilter containing extreme tags
			if (params.get('nsfw') != 'true') {
				const tagsSubfilter = newSubfilter();
				tagsSubfilter.exactBlacklist.tags = filteredTags.extreme;
				tagsSubfilter.matchAny = true;

				search.filter.subfilters.push(tagsSubfilter);
			}

			// Apply sort column and direction
			const sortField = params.get('sort');
			if (Object.hasOwn(searchInfo.sort, sortField)) {
				search.order.column = GameSearchSortable[sortField.toUpperCase()];
				search.order.direction = GameSearchDirection[params.get('dir') == 'desc' ? 'DESC' : 'ASC'];
			}

			// Add search filter to query as a subfilter
			search.filter.subfilters.push(searchFilter);

			// Get search result total and page info
			// We perform the actual search once the query receives an offset
			const totalResults = await fp.searchGamesTotal(search);
			const totalPages = Math.max(1, Math.ceil(totalResults / config.pageSize));
			const currentPage = Math.max(1, Math.min(totalPages, parseInt(params.get('page'), 10) || 1));
			let pageButtons = '';
			if (totalPages > 1) {
				// Apply offset to query based on current page
				if (currentPage > 1) {
					const searchIndex = await fp.searchGamesIndex(search, config.pageSize * (currentPage - 1));
					const offset = searchIndex[currentPage - 2];
					search.offset = {
						value: offset.orderVal,
						title: offset.title,
						gameId: offset.id,
					};
				}

				// Get URLs for page navigation buttons
				const nthPageUrl = new URL(url);
				nthPageUrl.searchParams.set('page', 1);
				const firstPageUrl = nthPageUrl.search;
				nthPageUrl.searchParams.set('page', Math.max(currentPage - 1, 1));
				const prevPageUrl = nthPageUrl.search;
				nthPageUrl.searchParams.set('page', Math.min(currentPage + 1, totalPages));
				const nextPageUrl = nthPageUrl.search;
				nthPageUrl.searchParams.set('page', totalPages);
				const lastPageUrl = nthPageUrl.search;

				// Build HTML for page navigation buttons
				pageButtons = utils.buildHtml(templates['search'].navigation_page, Object.assign(newDefs, {
					currentPage: currentPage.toLocaleString(lang),
					totalPages: totalPages.toLocaleString(lang),
					firstPageUrl: firstPageUrl,
					prevPageUrl: prevPageUrl,
					nextPageUrl: nextPageUrl,
					lastPageUrl: lastPageUrl,
				}));
			}

			// Get search results and turn into HTML
			const searchResults = await fp.searchGames(search);
			const searchResultsArr = [];
			for (const searchResult of searchResults) {
				// Display developer/publisher as creator if either exist
				let resultCreator = searchResult.developer || searchResult.publisher;
				if (resultCreator != '')
					resultCreator = `by ${resultCreator}`;

				// Build search result HTML
				searchResultsArr.push(utils.buildHtml(templates['search'].content_result, {
					resultId: searchResult.id,
					resultLogo: `${config.imageServer}/${searchResult.logoPath}?type=jpg`,
					resultTitle: utils.sanitizeInject(searchResult.title),
					resultCreator: utils.sanitizeInject(resultCreator),
					resultPlatform: searchResult.platforms.join('/'),
					resultLibrary: searchResult.library == 'arcade' ? 'game' : 'animation',
					resultTags: utils.sanitizeInject(searchResult.tags.join(' - ')),
				}));
			}

			// Build search content HTML
			searchContent = utils.buildHtml(templates['search'].navigation, Object.assign(newDefs, {
				totalResults: totalResults.toLocaleString(lang),
				resultsPerPageHidden: totalPages == 1 ? ' hidden' : '',
				searchResults: searchResultsArr.join('\n'),
				topPageButtons: pageButtons,
				bottomPageButtons: searchResults.length > 20 ? pageButtons : '',
			}));
		}
		else
			// If there is no active search, display statistics in place of search results
			searchContent = utils.buildHtml(templates['search'].content_stats, Object.assign(newDefs, {
				totalGames: searchStats.games.toLocaleString(lang),
				totalAnimations: searchStats.animations.toLocaleString(lang),
				totalGameZip: searchStats.gameZip.toLocaleString(lang),
				totalLegacy: searchStats.legacy.toLocaleString(lang),
				platformTotals: searchStats.platforms.map(([platform, total]) => utils.buildHtml(templates['search'].content_stats_row, {
					field: platform,
					value: total.toLocaleString(lang),
				})).join('\n'),
				tagTotals: searchStats.tags.map(([tag, total]) => utils.buildHtml(templates['search'].content_stats_row, {
					field: utils.sanitizeInject(tag),
					value: total.toLocaleString(lang),
				})).join('\n'),
				totalTags: tagStatsLimit.toLocaleString(lang),
			}));

		return {
			lastUpdate: utils.getFormattedDate(searchStats.lastUpdated, lang),
			searchInterface: searchInterface,
			searchContent: searchContent,
		};
	},
	'view': async (url, lang, defs) => {
		// Check if an ID has been supplied and if it is properly formatted
		const id = url.searchParams.get('id');
		if (id === null || !idExp.test(id))
			throw new utils.BadRequestError();

		// Fetch the entry, or display an error if it doesn't exist
		const entry = await fp.findGame(id);
		if (entry === null)
			throw new utils.NotFoundError(url, lang);

		// Check if entry is supported by 9o3o
		const oooExts = ['.swf', '.dcr', '.dir', '.dxr', '.wrl', '.wrl.gz', '.x3d'];
		const doOoo = [entry.legacyLaunchCommand]
			.concat(entry.gameData.map(gameData => gameData.launchCommand))
			.concat(entry.addApps.map(addApp => addApp.launchCommand))
			.map(launchCommand => launchCommand.toLowerCase())
			.some(launchCommandLower => oooExts.some(ext => launchCommandLower.includes(ext)));

		// Build entry viewer HTML
		const title = utils.sanitizeInject(entry.title);
		const newDefs = Object.assign({}, defs);
		const sortedGameData = entry.gameData.toSorted((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
		return {
			Title: title,
			Header: title,
			Author: entry.developer || entry.publisher,
			logoUrl: `${config.imageServer}/${entry.logoPath}`,
			screenshotUrl: `${config.imageServer}/${entry.screenshotPath}`,
			entryTable: buildTable(entry, viewInfo.game, doOoo ? 2 : 1),
			addAppInfo: entry.addApps.length == 0 ? '' : utils.buildHtml(templates['view'].addapp, Object.assign(newDefs, {
				addAppTables: entry.addApps.map(addApp => buildTable(addApp, viewInfo.addApp)).join('\n'),
			})),
			gameDataInfo: sortedGameData.length == 0 ? '' : utils.buildHtml(templates['view'].gamedata, Object.assign(newDefs, {
				gameDataTable: buildTable(sortedGameData[0], viewInfo.gameData),
			})),
			oldGameDataInfo: sortedGameData.length < 2 ? '' : utils.buildHtml(templates['view'].gamedata_old, Object.assign(newDefs, {
				oldGameDataTables: sortedGameData.slice(1).map(gameData => buildTable(gameData, viewInfo.gameData)).join('\n'),
			})),
		};
	},
	'search-info': (_, headers, lang) => {
		// Get search page translation
		const translation = Object.assign({},
			locales[config.defaultLang].translations['search'],
			locales[lang]?.translations['search'],
		);

		// Copy search info and insert translated filter strings into the copy
		const langSearchInfo = structuredClone(searchInfo);
		for (const type in langSearchInfo.filter) {
			for (const filter in langSearchInfo.filter[type]) {
				const def = langSearchInfo.filter[type][filter];
				langSearchInfo.filter[type][filter] = translation[def];
			}
		}

		// Serve the translated search info
		headers.set('Content-Type', 'application/json; charset=UTF-8');
		return new Response(JSON.stringify(langSearchInfo), { headers: headers });
	},
	'datahub': url => Response.redirect('https://flashpointarchive.org' + url.pathname),
	'discord': () => Response.redirect('https://discord.gg/kY8r2BbPQ9'),
};

// Build table HTML given a set of data and field definitions
// actions: 0 = no Actions row, 1 = Actions row without 9o3o link, 2 = Actions row with 9o3o link
function buildTable(source, fields, actions = 0) {
	const tableRowsArr = [];
	for (const field in fields) {
		const rawValue = source[field];
		// If value doesn't exist or is empty or blank, skip it
		if (rawValue === undefined || rawValue.length === 0)
			continue;

		const fieldInfo = fields[field];
		let value;
		switch (fieldInfo.type) {
			case 'string': {
				// Sanitize value or use real name if defined
				if (Object.hasOwn(fieldInfo, 'values') && Object.hasOwn(fieldInfo.values, rawValue))
					value = fieldInfo.values[rawValue].name;
				else
					value = utils.sanitizeInject(rawValue);
				break;
			}
			case 'list': {
				// Parse and sanitize list in respect to whether it is an array or a semicolon-delimited string
				let valueList = rawValue instanceof Array
					? rawValue.map(listValue => utils.sanitizeInject(listValue))
					: rawValue.split(';').map(listValue => utils.sanitizeInject(listValue.trim()));
				if (field == 'platforms' && Object.hasOwn(source, 'primaryPlatform'))
					// Remove primary platform from Other Technologies list
					valueList = valueList.filter(listValue => listValue != source.primaryPlatform);
				else if (field == 'language') {
					// Display real names of languages instead of their language codes
					const displayNames = new Intl.DisplayNames([config.defaultLang], { type: 'language' });
					valueList = valueList.map(listValue => {
						try { return displayNames.of(listValue); }
						catch { return listValue; }
					});
				}

				if (valueList.length > 0)
					// Render as a bulleted list if there are multiple values
					// Otherwise, render as a normal string
					value = valueList.length == 1
						? valueList[0]
						: `<ul>${valueList.map(listValue => `<li>${listValue}</li>`).join('')}</ul>`;
				break;
			}
			case 'date': {
				// Parse date into formatted string
				const parsedValue = new Date(rawValue);
				if (!isNaN(parsedValue)) {
					if (rawValue.length == 4)
						value = `${parsedValue.getUTCFullYear()}`;
					else if (rawValue.length == 7)
						value = `${parsedValue.getUTCMonth() + 1}/${parsedValue.getUTCFullYear()}`;
					else if (rawValue.length == 10)
						value = parsedValue.toLocaleDateString(config.defaultLang, { timeZone: 'UTC' });
					else
						value = parsedValue.toLocaleString(config.defaultLang, { timeZone: 'UTC' });
				}
				break;
			}
			case 'size': {
				// Format bytes into human-readable string
				if (typeof(rawValue) == 'number')
					value = format(rawValue, { locale: config.defaultLang });
				break;
			}
			case 'number': {
				// Parse number into comma-separated string
				const parsedValue = parseInt(rawValue, 10);
				if (!isNaN(parsedValue))
					value = parsedValue.toLocaleString(config.defaultLang);
				break;
			}
		}

		// If value was able to be parsed, build HTML for its respective table row
		if (value !== undefined)
			tableRowsArr.push(utils.buildHtml(templates['view'].table_row, {
				field: fieldInfo.name + ':',
				value: value.replaceAll('\n', '<br>'),
			}));
	}

	// Include action buttons in entry info table
	if (actions > 0)
		tableRowsArr.push(utils.buildHtml(templates['view'].table_row, {
			field: 'Actions:',
			value: utils.buildHtml(templates['view'].table_actions, {
				id: source.id,
				oooHidden: actions == 2 ? '' : ' fp-hidden',
			}),
		}));

	// Build and return table HTML
	return utils.buildHtml(templates['view'].table, { tableRows: tableRowsArr.join('\n') });
}