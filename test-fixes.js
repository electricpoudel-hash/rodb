#!/usr/bin/env node

const http = require('http');

const API_BASE = 'http://localhost:3000/api';
const ADMIN_TOKEN = 'test_admin_token'; // This will need to be a real token

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData, headers: res.headers });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Starting comprehensive tests for all fixes...\n');

    try {
        // Test 1: Check media upload endpoint exists
        console.log('✅ Test 1: Media Upload Endpoint');
        console.log('   Testing /api/media/upload endpoint...');
        
        // Create a small test image (1x1 transparent PNG)
        const testImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        
        const uploadResult = await makeRequest('POST', '/media/upload', {
            base64Data: `data:image/png;base64,${testImage}`,
            filename: 'test-image.png'
        });
        
        if (uploadResult.status === 200 && uploadResult.data.url) {
            console.log(`   ✓ Media upload working: ${uploadResult.data.url}`);
        } else {
            console.log(`   ✗ Media upload failed: ${uploadResult.status}`);
        }

        // Test 2: Check ads endpoint (without auth, might fail but we're testing the route exists)
        console.log('\n✅ Test 2: Ads Endpoint');
        console.log('   Testing /api/ads endpoint...');
        
        const adsResult = await makeRequest('GET', '/ads');
        if (adsResult.status === 200 && Array.isArray(adsResult.data.ads)) {
            console.log(`   ✓ Ads endpoint working: Found ${adsResult.data.ads.length} ads`);
        } else if (adsResult.status === 200) {
            console.log(`   ✓ Ads endpoint responding`);
        } else {
            console.log(`   Status: ${adsResult.status}`);
        }

        // Test 3: Check articles endpoint
        console.log('\n✅ Test 3: Articles Endpoint (sorting)');
        console.log('   Testing /api/articles endpoint...');
        
        const articlesResult = await makeRequest('GET', '/articles');
        if (articlesResult.status === 200 && Array.isArray(articlesResult.data.articles)) {
            console.log(`   ✓ Articles endpoint working: Found ${articlesResult.data.articles.length} articles`);
            
            // Verify sorting - check if first article is newer than last
            if (articlesResult.data.articles.length > 1) {
                const first = new Date(articlesResult.data.articles[0].published_at);
                const last = new Date(articlesResult.data.articles[articlesResult.data.articles.length - 1].published_at);
                if (first >= last) {
                    console.log(`   ✓ Articles sorted correctly (newest first)`);
                } else {
                    console.log(`   ✗ Articles not sorted correctly`);
                }
            }
        } else {
            console.log(`   Status: ${articlesResult.status}`);
        }

        // Test 4: Check settings endpoint for trending articles
        console.log('\n✅ Test 4: Settings Endpoint');
        console.log('   Testing /api/settings (public) endpoint...');
        
        const settingsResult = await makeRequest('GET', '/settings');
        if (settingsResult.status === 200) {
            console.log(`   ✓ Settings endpoint working`);
            if (settingsResult.data.settings) {
                const hasTrendingArticles = settingsResult.data.settings.some(s => s.key === 'trending_articles');
                const hasHotNews = settingsResult.data.settings.some(s => s.key === 'hot_news');
                const hasAbout = settingsResult.data.settings.some(s => s.key === 'about_content');
                const hasContact = settingsResult.data.settings.some(s => s.key === 'contact_content');
                
                console.log(`   ✓ trending_articles: ${hasTrendingArticles}`);
                console.log(`   ✓ hot_news: ${hasHotNews}`);
                console.log(`   ✓ about_content: ${hasAbout}`);
                console.log(`   ✓ contact_content: ${hasContact}`);
            }
        }

        // Test 5: Check navigation endpoint
        console.log('\n✅ Test 5: Navigation Endpoint');
        console.log('   Testing /api/navigation endpoint...');
        
        const navResult = await makeRequest('GET', '/navigation');
        if (navResult.status === 200 && Array.isArray(navResult.data.items)) {
            console.log(`   ✓ Navigation endpoint working: Found ${navResult.data.items.length} items`);
            
            // Check for hardcoded navigation
            const hardcoded = ['International', 'Politics', 'Business'];
            const navLabels = navResult.data.items.map(i => i.label);
            const foundHardcoded = hardcoded.filter(h => navLabels.includes(h));
            
            if (foundHardcoded.length === 0) {
                console.log(`   ✓ No hardcoded navigation items found`);
            } else {
                console.log(`   ⚠ Found possibly hardcoded items: ${foundHardcoded.join(', ')}`);
            }
        }

        console.log('\n✅ All tests completed!\n');

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
}

runTests();
