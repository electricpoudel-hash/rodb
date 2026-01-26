// API Base URL
const API_BASE = '/api';

// State
let currentPage = 0;
const pageSize = 12;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadDate();
    loadNavigation();
    loadNewsTicker();
    loadAds();
    loadHeroSection();
    loadLatestArticles();
    loadTrending();
});

// Theme Management
function initTheme() {
    const toggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    toggle.textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        toggle.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    });
}

// Date Display (Nepali Date could be added here later with a library)
function loadDate() {
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dateDisplay').textContent = new Date().toLocaleDateString('ne-NP', dateOptions);
}

// Load Navigation
async function loadNavigation() {
    try {
        const response = await fetch(`${API_BASE}/navigation`);
        const data = await response.json();

        const nav = document.getElementById('dynamicNav');
        const footerNav = document.getElementById('footerNav');

        const html = data.items.map(item =>
            `<li class="nav-item"><a href="${item.url}">${item.label}</a></li>`
        ).join('');

        nav.innerHTML = `<li class="nav-item"><a href="/">गृहपृष्ठ</a></li>` + html;
        footerNav.innerHTML = html;

    } catch (e) {
        console.error('Nav load error', e);
    }
}

// Load Ticker
async function loadNewsTicker() {
    try {
        const response = await fetch(`${API_BASE}/settings/public`);
        const data = await response.json();

        // Ticker logic from settings or articles
        const tickerEnabled = data.settings?.find(s => s.key === 'ticker_enabled')?.value === 'true';
        if (!tickerEnabled) { document.getElementById('newsTicker').style.display = 'none'; return; }

        const tickerText = data.settings?.find(s => s.key === 'ticker_text')?.value;
        let items = [];

        if (tickerText) {
            items = tickerText.split('|');
        } else {
            // Fallback to articles
            const artRes = await fetch(`${API_BASE}/articles?limit=5`);
            const artData = await artRes.json();
            items = artData.articles.map(a => a.headline);
        }

        const html = items.map(item => `<span class="ticker-item">${item}</span>`).join('');
        document.getElementById('tickerItems').innerHTML = html + html; // Duplicate for loop

    } catch (e) {
        console.error('Ticker error', e);
    }
}

// Load Ads
async function loadAds() {
    try {
        const response = await fetch(`${API_BASE}/ads`);
        const data = await response.json();

        const placements = {
            'header': 'ad_header',
            'sidebar': 'ad_sidebar',
            'content_top': 'ad_content_top',
            'content_bottom': 'ad_content_bottom'
        };

        // Group by placement and pick random
        const adsByPlacement = {};
        data.ads.forEach(ad => {
            if (!adsByPlacement[ad.placement]) adsByPlacement[ad.placement] = [];
            adsByPlacement[ad.placement].push(ad);
        });

        Object.keys(placements).forEach(key => {
            if (adsByPlacement[key] && adsByPlacement[key].length > 0) {
                const ads = adsByPlacement[key];
                const ad = ads[Math.floor(Math.random() * ads.length)]; // Random rotation
                const container = document.getElementById(placements[key]);

                if (container) {
                    container.innerHTML = `
                        <a href="${ad.link_url}" target="_blank" onclick="trackClick(${ad.id})">
                            <img src="${ad.image_url}" alt="${ad.title}">
                        </a>
                    `;
                    // Track impression
                    fetch(`${API_BASE}/ads/${ad.id}/impression`, { method: 'POST' });
                }
            }
        });

    } catch (e) {
        console.error('Ads error', e);
    }
}

function trackClick(id) {
    fetch(`${API_BASE}/ads/${id}/click`, { method: 'POST' });
}

// Load Hero
async function loadHeroSection() {
    try {
        const response = await fetch(`${API_BASE}/articles?featured=true&limit=1`);
        const data = await response.json();
        const hero = document.getElementById('heroSection');

        if (data.articles && data.articles.length > 0) {
            const article = data.articles[0];
            hero.innerHTML = `
                <div class="hero-main">
                    <a href="/article.html?slug=${article.slug}">
                        <img src="${article.featured_image_url || '/public/fablo/logo.png'}" alt="${article.headline}">
                        <div class="hero-content">
                            <h2>${article.headline}</h2>
                            <p>${article.summary || ''}</p>
                        </div>
                    </a>
                </div>
                <div class="hero-list">
                   <!-- Additional top news could go here -->
                </div>
            `;
        }
    } catch (e) { console.error(e); }
}

// Load Articles
async function loadLatestArticles() {
    try {
        const response = await fetch(`${API_BASE}/articles?limit=${pageSize}&offset=${currentPage * pageSize}`);
        const data = await response.json();
        const grid = document.getElementById('latestArticles');

        const html = data.articles.map(article => `
            <div class="article-card">
                <a href="/article.html?slug=${article.slug}" style="text-decoration:none; color:inherit;">
                    <img src="${article.featured_image_url || '/public/fablo/logo.png'}" loading="lazy">
                    <div class="article-content">
                        <div class="article-meta">
                            ${new Date(article.published_at).toLocaleDateString()} | ${article.category_name || 'News'}
                        </div>
                        <h3 class="article-title">${article.headline}</h3>
                    </div>
                </a>
            </div>
        `).join('');

        if (currentPage === 0) grid.innerHTML = html;
        else grid.insertAdjacentHTML('beforeend', html);

    } catch (e) { console.error(e); }
}

document.getElementById('loadMore').addEventListener('click', () => {
    currentPage++;
    loadLatestArticles();
});

// Mock Trending
function loadTrending() {
    // In real app, fetch from API
    // Placeholder
}
