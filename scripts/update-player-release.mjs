import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const repository = 'mp3chapters/mp3chapters-player';
const releaseBase = `https://github.com/${repository}/releases`;

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[char]);
}

function replaceOne(html, pattern, value) {
    let count = 0;
    const result = html.replace(pattern, (_, before, after) => {
        count++;
        return before + escapeHtml(value) + after;
    });
    if (count !== 1) throw new Error(`Expected one page marker for ${pattern}; found ${count}`);
    return result;
}

export function updatePage(html, release) {
    const version = /^app-v(\d+\.\d+\.\d+)$/.exec(release.tag_name)?.[1];
    if (!version || release.draft || release.prerelease) {
        throw new Error('Only published stable app-vX.Y.Z releases can update the website');
    }
    const published = new Date(release.published_at);
    if (!release.published_at || Number.isNaN(published.getTime())) {
        throw new Error('The release must have a valid publication date');
    }
    const date = new Intl.DateTimeFormat('en-US', {
        month: 'long', year: 'numeric', timeZone: 'UTC',
    }).format(published);
    const assets = {};
    for (const [platform, suffix] of Object.entries({
        'macos-arm': '_aarch64.dmg', 'macos-intel': '_x64.dmg',
        windows: '_x64-setup.exe', linux: '_amd64.deb',
    })) {
        const matches = (release.assets || []).filter(asset => asset.name?.endsWith(suffix));
        if (matches.length !== 1) throw new Error(`Expected exactly one ${platform} installer`);
        const asset = matches[0];
        const prefix = `${releaseBase}/download/${encodeURIComponent(release.tag_name)}/`;
        if (asset.state !== 'uploaded' || !Number.isSafeInteger(asset.size) || asset.size <= 0 ||
            !asset.browser_download_url?.startsWith(prefix)) {
            throw new Error(`Invalid or incomplete ${platform} installer`);
        }
        assets[platform] = asset;
    }

    const links = Object.fromEntries(Object.entries(assets).map(([key, asset]) => [key, asset.browser_download_url]));
    links.release = `${releaseBase}/tag/${encodeURIComponent(release.tag_name)}`;
    for (const [key, url] of Object.entries(links)) {
        html = replaceOne(html, new RegExp(`(<a\\b(?=[^>]*\\bdata-player-asset="${key}")[^>]*\\bhref=")[^"]*(")`, 'g'), url);
    }
    const size = asset => (asset.size / 1_000_000).toFixed(1);
    const macSizes = [...new Set([size(assets['macos-arm']), size(assets['macos-intel'])])]
        .sort((a, b) => Number(a) - Number(b)).join('–');
    for (const [key, value] of Object.entries({
        version, date, 'updated-date': date, 'macos-size': `${macSizes} MB`,
        'windows-size': `${size(assets.windows)} MB`, 'linux-size': `${size(assets.linux)} MB`,
    })) {
        html = replaceOne(html, new RegExp(`(<span data-player-meta="${key}">)[\\s\\S]*?(</span>)`, 'g'), value);
    }
    return html;
}

async function getRelease(endpoint) {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GH_TOKEN) headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
    const response = await fetch(`https://api.github.com/repos/${repository}/releases/${endpoint}`, {
        headers, signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`GitHub release lookup failed (${response.status})`);
    return response.json();
}

async function main() {
    const latest = await getRelease('latest');
    const tag = process.env.RELEASE_TAG || latest.tag_name;
    // A delayed event or manual retry must never move the website back to an older release.
    if (tag !== latest.tag_name) throw new Error(`${tag} is not the latest stable release (${latest.tag_name})`);
    const page = new URL('../player/index.html', import.meta.url);
    const html = await readFile(page, 'utf8');
    const updated = updatePage(html, latest);
    await writeFile(page, updated);
    console.log(`${updated === html ? 'Already synced' : 'Updated'} player page to ${tag}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
