// API Configuration
const API_BASE_URL = 'http://localhost:3000/api/v2';
const API_KEY = 'dev-api-key-12345'; // Development API key

// API Helper Functions
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Add authentication for POST/PUT/DELETE requests
    if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
        headers['Authorization'] = API_KEY;
    }
    
    try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Load mods from API
async function loadMods() {
    try {
        const data = await fetchAPI('/mods');
        return data.hits || [];
    } catch (error) {
        console.error('Failed to load mods:', error);
        return [];
    }
}

// Search mods from API
async function searchMods(query, filters = {}) {
    try {
        const params = new URLSearchParams({ query, ...filters });
        const data = await fetchAPI(`/mods?${params}`);
        return data.hits || [];
    } catch (error) {
        console.error('Failed to search mods:', error);
        return [];
    }
}

// Check mod compatibility
async function checkCompatibility(modId, version, loader) {
    try {
        const result = await fetchAPI('/compatibility/check', {
            method: 'POST',
            body: JSON.stringify({
                mod_id: modId,
                minecraft_version: version,
                loader: loader
            })
        });
        return result;
    } catch (error) {
        console.error('Failed to check compatibility:', error);
        return { compatible: false, dependencies: [], conflicts: [] };
    }
}

// Mobile Navigation Toggle
const navMenu = document.getElementById('nav-menu');
const navLink = document.querySelector('.nav-link');

if (navMenu && navLink) {
navMenu.addEventListener('click', () => {
navLink.classList.toggle('active');
});
}

// Close menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-link a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navLink.classList.remove('active');
    });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        
        // Only prevent default if target exists on current page
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Copy to Clipboard Functionality
const copyButtons = document.querySelectorAll('.copy-btn');
copyButtons.forEach(button => {
    button.addEventListener('click', () => {
        const codeBlock = button.closest('.code-block');
        const code = codeBlock.querySelector('code').textContent;
        
        navigator.clipboard.writeText(code).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.background = 'var(--success)';
            button.style.color = '#000';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
                button.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            button.textContent = 'Failed';
        });
    });
});

// Mod Loader Filter Functionality
const loaderButtons = document.querySelectorAll('.loader-btn');
loaderButtons.forEach(button => {
    button.addEventListener('click', async () => {
        // Remove active class from all buttons
        loaderButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        const filter = button.textContent.toLowerCase();
        const versionSelect = document.querySelector('.version-select');
        const selectedVersion = versionSelect ? versionSelect.value : 'all';
        
        // Build filters object
        const filters = {};
        if (filter !== 'all') filters.loader = filter;
        if (selectedVersion !== 'all') filters.version = selectedVersion;
        
        // Fetch filtered mods from API
        try {
            const mods = await searchMods('', filters);
            renderMods(mods);
        } catch (error) {
            console.error('Failed to filter mods:', error);
        }
    });
});

// Minecraft Version Filter Functionality
const versionSelect = document.querySelector('.version-select');
if (versionSelect) {
    versionSelect.addEventListener('change', async () => {
        const selectedVersion = versionSelect.value;
        const activeLoaderBtn = document.querySelector('.loader-btn.active');
        const selectedLoader = activeLoaderBtn ? activeLoaderBtn.textContent.toLowerCase() : 'all';
        
        // Build filters object
        const filters = {};
        if (selectedLoader !== 'all') filters.loader = selectedLoader;
        if (selectedVersion !== 'all') filters.version = selectedVersion;
        
        // Fetch filtered mods from API
        try {
            const mods = await searchMods('', filters);
            renderMods(mods);
        } catch (error) {
            console.error('Failed to filter mods:', error);
        }
    });
}

// Plugin Filter Functionality
const filterButtons = document.querySelectorAll('.filter-btn');
const pluginCards = document.querySelectorAll('.plugin-card');

filterButtons.forEach(button => {
    button.addEventListener('click', async () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        const filter = button.textContent.toLowerCase();
        
        // Fetch mods from API with category filter
        try {
            const mods = await searchMods('', { category: filter === 'all' ? undefined : filter });
            renderMods(mods);
        } catch (error) {
            console.error('Failed to filter mods:', error);
        }
    });
});

// Render mods from API data
function renderMods(mods) {
    const pluginGrid = document.querySelector('.plugin-grid');
    if (!pluginGrid) return;
    
    pluginGrid.innerHTML = '';
    
    mods.forEach(mod => {
        const card = createModCard(mod);
        pluginGrid.appendChild(card);
    });
}

// Create mod card HTML
function createModCard(mod) {
    const card = document.createElement('div');
    card.className = 'plugin-card';
    
    // Get compatibility badges
    const compatibilityBadges = Object.entries(mod.compatibility)
        .filter(([_, versions]) => versions.length > 0)
        .map(([loader, versions]) => {
            const latestVersion = versions[0];
            return `<span class="compat-badge ${loader}">${loader}</span>
                    <span class="compat-badge version">${latestVersion}</span>`;
        }).join('');
    
    // Format download count
    const formattedDownloads = formatDownloads(mod.downloads);
    
    card.innerHTML = `
        <div class="plugin-icon">${mod.icon}</div>
        <h3 class="plugin-title">${mod.title}</h3>
        <p class="plugin-description">${mod.description}</p>
        <div class="plugin-meta">
            <span class="plugin-author">by ${mod.author}</span>
            <span class="plugin-version">v${mod.version}</span>
            <span class="plugin-rating">⭐ ${mod.rating}</span>
            <span class="plugin-downloads">${formattedDownloads}</span>
        </div>
        <div class="mod-compatibility">
            ${compatibilityBadges}
        </div>
        <button class="plugin-btn">View Details</button>
    `;
    
    // Add click handler for view details button
    const viewBtn = card.querySelector('.plugin-btn');
    viewBtn.addEventListener('click', () => {
        showModDetails(mod);
    });
    
    return card;
}

// Format download numbers
function formatDownloads(downloads) {
    if (downloads >= 1000000) {
        return (downloads / 1000000).toFixed(1) + 'M+';
    } else if (downloads >= 1000) {
        return (downloads / 1000).toFixed(1) + 'K+';
    }
    return downloads.toString();
}

// Show mod details (modal or alert)
function showModDetails(mod) {
    alert(`Viewing details for: ${mod.title}\n\n` +
          `Author: ${mod.author}\n` +
          `Version: ${mod.version}\n` +
          `Downloads: ${formatDownloads(mod.downloads)}\n` +
          `Rating: ${mod.rating}/5\n\n` +
          `In a full implementation, this would open a detailed mod page with download options, versions, and dependencies.`);
}

// Search Functionality
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');

async function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        // Load all mods
        try {
            const mods = await loadMods();
            renderMods(mods);
        } catch (error) {
            console.error('Failed to load mods:', error);
        }
        return;
    }
    
    // Search mods from API
    try {
        const mods = await searchMods(searchTerm);
        renderMods(mods);
    } catch (error) {
        console.error('Failed to search mods:', error);
    }
    
    // Search in documentation sections
    const docSections = document.querySelectorAll('.doc-section');
    docSections.forEach(section => {
        const text = section.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            section.style.display = 'block';
            section.style.animation = 'fadeIn 0.3s ease';
        } else {
            section.style.display = 'none';
        }
    });
}

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Clear search when input is empty
searchInput.addEventListener('input', async () => {
    if (searchInput.value === '') {
        try {
            const mods = await loadMods();
            renderMods(mods);
        } catch (error) {
            console.error('Failed to load mods:', error);
        }
        const docSections = document.querySelectorAll('.doc-section');
        docSections.forEach(section => {
            section.style.display = 'block';
        });
    }
});

// Hero Button Interactions (for smooth scrolling to sections)
const heroButtons = document.querySelectorAll('.hero-btn');
heroButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        // If it's a link with hash, let the smooth scrolling handle it
        if (button.getAttribute('href') && button.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = button.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Mod Card Interactions
const pluginButtons = document.querySelectorAll('.plugin-btn');
pluginButtons.forEach(button => {
    button.addEventListener('click', () => {
        const card = button.closest('.plugin-card');
        const title = card.querySelector('.plugin-title').textContent;
        alert(`Viewing details for: ${title}\n\nThis would open a detailed mod page with download options, versions, and dependencies in a full implementation.`);
    });
});

// Reference Card Interactions
const referenceCards = document.querySelectorAll('.reference-card');
referenceCards.forEach(card => {
    card.addEventListener('click', () => {
        const title = card.querySelector('h4').textContent;
        alert(`Opening reference: ${title}\n\nThis would expand to show detailed reference information.`);
    });
});

// Add CSS animation for fade in
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        // Scrolling down
        navbar.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        navbar.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

// Add transition to navbar
navbar.style.transition = 'transform 0.3s ease';

// Initialize: Load mods from API when page loads
async function initializeApp() {
    try {
        const mods = await loadMods();
        renderMods(mods);
        console.log(`Loaded ${mods.length} mods from API`);
    } catch (error) {
        console.error('Failed to initialize app:', error);
        // Fallback to hardcoded cards if API fails
        console.log('Using fallback hardcoded mod cards');
    }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

console.log('MoonWiki API & Mods Documentation loaded successfully!');