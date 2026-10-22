import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { updatePage } from '../scripts/update-player-release.mjs';

const html = await readFile(new URL('../player/index.html', import.meta.url), 'utf8');

function release() {
    const tag = 'app-v1.2.3';
    return {
        tag_name: tag, draft: false, prerelease: false, published_at: '2026-10-22T14:00:00Z',
        assets: [
            ['Player_1.2.3_aarch64.dmg', 5_000_000], ['Player_1.2.3_x64.dmg', 6_000_000],
            ['Player_1.2.3_x64-setup.exe', 7_000_000], ['Player_1.2.3_amd64.deb', 8_000_000],
        ].map(([name, size]) => ({
            name, size, state: 'uploaded',
            browser_download_url: `https://github.com/mp3chapters/mp3chapters-player/releases/download/${tag}/${name}`,
        })),
    };
}

test('updates every platform, actual asset sizes, version, publication date, and release notes link', () => {
    const updated = updatePage(html, release());
    for (const asset of release().assets) assert.ok(updated.includes(asset.browser_download_url));
    assert.match(updated, /data-player-meta="version">1\.2\.3</);
    assert.match(updated, /data-player-meta="date">October 2026</);
    assert.match(updated, /data-player-meta="updated-date">October 2026</);
    assert.match(updated, /data-player-meta="macos-size">5\.0–6\.0 MB</);
    assert.match(updated, /data-player-meta="windows-size">7\.0 MB</);
    assert.match(updated, /data-player-meta="linux-size">8\.0 MB</);
    assert.ok(updated.includes('/releases/tag/app-v1.2.3'));
    assert.equal(updatePage(updated, release()), updated);
    // Leave the manually maintained screenshot and descriptive copy alone.
    assert.ok(updated.includes('src="screenshot.jpg"'));
    assert.ok(updated.includes('Free and open source.'));
});

test('rejects drafts, prereleases, unknown tags, and missing publication dates', () => {
    for (const overrides of [
        { draft: true }, { prerelease: true }, { tag_name: 'unrelated' },
        { published_at: null }, { published_at: 'invalid' },
    ]) assert.throws(() => updatePage(html, { ...release(), ...overrides }));
});

test('rejects missing, duplicate, empty, pending, or foreign download assets', () => {
    for (const change of [
        data => data.assets.pop(),
        data => data.assets.push(data.assets[0]),
        data => { data.assets[0].size = 0; },
        data => { data.assets[0].state = 'new'; },
        data => { data.assets[0].browser_download_url = 'https://example.com/installer.dmg'; },
    ]) {
        const data = release();
        change(data);
        assert.throws(() => updatePage(html, data));
    }
});

test('escapes asset URLs and refuses to silently ignore missing or duplicate page markers', () => {
    const data = release();
    data.assets[0].browser_download_url += '?test="&';
    assert.ok(updatePage(html, data).includes('?test=&quot;&amp;'));
    assert.throws(() => updatePage(html.replace('data-player-meta="date"', 'data-player-meta="missing"'), release()));
    assert.throws(() => updatePage(`${html}<span data-player-meta="date">Duplicate</span>`, release()));
});
