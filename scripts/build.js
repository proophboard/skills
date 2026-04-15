const fs = require('fs-extra');
const path = require('path');
const { globSync } = require('glob');
const { marked } = require('marked');
const archiver = require('archiver');

const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const DIST_DIR = path.join(ROOT, 'dist');

const LOGO_URL = 'https://prooph-board.com/images/favicon.png';

/**
 * Collect all skills from skill.json files
 */
function collectSkills() {
  const skillJsonFiles = globSync('**/skill.json', { cwd: SKILLS_DIR, absolute: true });
  
  return skillJsonFiles.map(file => {
    const skill = fs.readJsonSync(file);
    const skillDir = path.dirname(file);
    const readmePath = path.join(skillDir, 'README.md');
    const readmeExists = fs.existsSync(readmePath);
    const readmeContent = readmeExists ? fs.readFileSync(readmePath, 'utf-8') : '';

    const skillMdPath = path.join(skillDir, 'SKILL.md');
    const skillMdExists = fs.existsSync(skillMdPath);
    const skillMdContent = skillMdExists ? fs.readFileSync(skillMdPath, 'utf-8') : '';
    
    // Check for _assets directory
    const assetsDir = path.join(skillDir, '_assets');
    const hasAssets = fs.existsSync(assetsDir);
    
    // Resolve README relative path for assets
    const relativePath = path.relative(SKILLS_DIR, skillDir);
    
    return {
      ...skill,
      readmeContent,
      readmeExists,
      skillMdContent,
      skillMdExists,
      hasAssets,
      relativePath,
      assetsDir: hasAssets ? assetsDir : null,
      // Generate URL-friendly slug
      slug: skill.name.toLowerCase(),
    };
  });
}

/**
 * Collect all unique tags from skills
 */
function collectTags(skills) {
  const tagMap = new Map();

  skills.forEach(skill => {
    (skill.tags || []).forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag).push(skill);
    });
  });

  return tagMap;
}

/**
 * Parse CHANGELOG.md and return the latest date entry as HTML
 */
function getLatestChangelog() {
  const changelogPath = path.join(ROOT, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) return null;

  const content = fs.readFileSync(changelogPath, 'utf-8');

  // Split by ## date headers and get the first entry (after # Changelog)
  const entries = content.split(/^## (\d{4}-\d{2}-\d{2})$/m);
  // entries[0] = "# Changelog\n\n"
  // entries[1] = date
  // entries[2] = content until next date
  if (entries.length < 3) return null;

  const date = entries[1];
  const entryContent = entries[2];

  // Format the date nicely
  const dateObj = new Date(date + 'T00:00:00Z');
  const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Render the entry content as HTML
  const renderedContent = marked.parse(entryContent.trim());

  return {
    date: formattedDate,
    rawDate: date,
    html: renderedContent
  };
}

/**
 * Render markdown to HTML with GitHub-flavored markdown
 */
function renderMarkdown(content, assetsBaseUrl = '') {
  let frontmatterHTML = '';
  
  // Extract YAML frontmatter (delimited by ---)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    content = content.slice(frontmatterMatch[0].length).trimStart();
    
    // Parse key: value pairs
    const lines = frontmatter.split('\n');
    const rows = lines
      .map(line => {
        const match = line.match(/^(\S+):\s*(.*)/);
        if (!match) return '';
        const [, key, value] = match;
        // Strip surrounding quotes from value if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        return `<tr><th>${key}</th><td>${cleanValue}</td></tr>`;
      })
      .filter(Boolean)
      .join('');
    
    frontmatterHTML = `<table class="frontmatter"><tbody>${rows}</tbody></table>`;
  }
  const renderer = new marked.Renderer();
  
  // Override image renderer to handle relative paths and wrap in magnifier
  renderer.image = (href, title, text) => {
    // If href is relative and we have an assets base URL, prepend it
    if (assetsBaseUrl && href && !href.startsWith('http://') && !href.startsWith('https://')) {
      href = path.posix.join(assetsBaseUrl, href);
    }
    
    let out = `<span class="img-wrapper"><img src="${href}" alt="${text}"`;
    if (title) {
      out += ` title="${title}"`;
    }
    out += `>`;
    out += `<span class="magnify-icon"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 10-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 001.415-1.414l-3.85-3.85a1.007 1.007 0 00-.115-.1zM12 6.5a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z"/></svg></span>`;
    out += `</span>`;
    return out;
  };
  
  // Override link renderer
  renderer.link = (href, title, text) => {
    // Keep external links as-is, internal links should be relative
    if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#')) {
      // Could be a relative path to another skill or asset
    }
    
    let out = `<a href="${href}"`;
    if (title) {
      out += ` title="${title}"`;
    }
    out += `>${text}</a>`;
    return out;
  };
  
  // Configure marked options
  marked.setOptions({
    renderer,
    gfm: true,
    breaks: true,
  });
  
  const rendered = marked.parse(content);
  return frontmatterHTML + rendered;
}

/**
 * Generate HTML page with common template
 */
function generateHTML(title, content, extraHead = '', bodyClass = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - prooph board Skills</title>
  <link rel="shortcut icon" href="/images/favicon.png">
  <link rel="stylesheet" href="/css/styles.css">
  ${extraHead}
</head>
<body class="${bodyClass}">
  <header class="site-header">
    <div class="container header-content">
      <div class="logo-area">
        <a href="https://prooph-board.com" class="logo-link">
          <img src="${LOGO_URL}" alt="prooph board" class="logo" onerror="this.style.display='none'">
        </a>
        <span class="site-title">prooph board Skills</span>
      </div>
      <nav class="header-nav">
        <a href="/" class="nav-link">Browse Skills</a>
        <a href="https://github.com/proophboard/skills" class="nav-link github-link" target="_blank" rel="noopener">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" aria-label="GitHub">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          GitHub
        </a>
        <div class="theme-toggle">
          <button class="theme-toggle-btn" id="theme-toggle" aria-label="Toggle dark mode">
            <svg class="icon-sun" width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 11a3 3 0 110-6 3 3 0 010 6zm0 1a4 4 0 100-8 4 4 0 000 8zM8 0a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 0zm0 13a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 018 13zm8-5a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2a.5.5 0 01.5.5zM3 8a.5.5 0 01-.5.5h-2a.5.5 0 010-1h2A.5.5 0 013 8zm10.657-5.657a.5.5 0 010 .707l-1.414 1.415a.5.5 0 11-.707-.708l1.414-1.414a.5.5 0 01.707 0zm-9.193 9.193a.5.5 0 010 .707l-1.414 1.414a.5.5 0 01-.707-.707l1.414-1.414a.5.5 0 01.707 0zm9.193 2.121a.5.5 0 01-.707 0l-1.414-1.414a.5.5 0 01.707-.707l1.414 1.414a.5.5 0 010 .707zM4.464 4.465a.5.5 0 01-.707 0L2.343 3.05a.5.5 0 11.707-.707l1.414 1.414a.5.5 0 010 .708z"/>
            </svg>
            <svg class="icon-moon" width="18" height="18" viewBox="0 0 16 16" fill="currentColor" style="display:none;">
              <path d="M6 .278a.768.768 0 01.08.858 7.208 7.208 0 00-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 01.81.316.733.733 0 01-.031.893A8.349 8.349 0 018.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 016 .278zM4.868 5.222A.625.625 0 014.368 6c0 2.391 1.973 4.352 4.435 4.404a.625.625 0 01.39.938.625.625 0 01-.86.304 5.701 5.701 0 01-3.465-3.465.625.625 0 01.304-.86.625.625 0 01.696.301z"/>
            </svg>
          </button>
        </div>
      </nav>
    </div>
  </header>
  <main class="container main-content">
    <div class="content-layout">
      <div class="content-main">
        ${content}
      </div>
      <aside class="content-sidebar">
        <div class="sidebar-card">
          <h3 class="sidebar-card-title">Submit Your Own Skill</h3>
          <p class="sidebar-card-text">
            Have you developed custom skills for AI agents working on and with prooph board?
            Share them with the community!
          </p>
          <a href="https://github.com/proophboard/skills/blob/main/README.md#how-to-contribute" class="sidebar-cta-button" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Contribute on GitHub
          </a>
          <div class="sidebar-reward">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0l2.5 5.1 5.5.8-4 3.9.9 5.5L8 12.7 3.1 15.3l.9-5.5-4-3.9 5.5-.8z"/>
            </svg>
            <span>Earn a <strong>free workspace seat</strong> for each accepted contribution!</span>
          </div>
        </div>
      </aside>
    </div>
  </main>
  <footer class="site-footer">
    <div class="container footer-content">
      <p>&copy; ${new Date().getFullYear()} prooph software GmbH. Licensed under MIT.</p>
    </div>
  </footer>
  <div class="image-overlay" id="image-overlay">
    <img src="" alt="" id="overlay-image">
  </div>
  <script>
    (function() {
      var toggle = document.getElementById('theme-toggle');
      if (!toggle) return;
      var sunIcon = toggle.querySelector('.icon-sun');
      var moonIcon = toggle.querySelector('.icon-moon');
      var storedTheme = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
          sunIcon.style.display = 'block';
          moonIcon.style.display = 'none';
        } else {
          sunIcon.style.display = 'none';
          moonIcon.style.display = 'block';
        }
      }
      
      if (storedTheme) {
        setTheme(storedTheme);
      } else if (prefersDark) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
      
      toggle.addEventListener('click', function() {
        var current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
      });
    })();

    function switchTab(tabName, btn) {
      document.querySelectorAll('.tab-button').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('tab-' + tabName).classList.add('active');
    }

    (function() {
      var overlay = document.getElementById('image-overlay');
      var overlayImg = document.getElementById('overlay-image');
      if (!overlay || !overlayImg) return;

      document.addEventListener('click', function(e) {
        var img = e.target.closest('.img-wrapper');
        if (img) {
          var src = img.querySelector('img').src;
          overlayImg.src = src;
          overlay.classList.add('active');
          document.body.style.overflow = 'hidden';
        } else if (e.target === overlay || e.target === overlayImg) {
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    })();
  </script>
</body>
</html>`;
}

/**
 * Generate skill card HTML
 */
function generateSkillCard(skill) {
  const tagsHTML = (skill.tags || [])
    .slice(0, 4)
    .map(tag => `<a href="/tags/${tag}.html" class="tag-link">${tag}</a>`)
    .join('');
  
  return `
    <div class="skill-card">
      <a href="/skills/${skill.slug}.html" class="skill-card-link">
        <h3 class="skill-name">${skill.name}</h3>
      </a>
      <p class="skill-version">v${skill.version}</p>
      <p class="skill-description">${skill.description.substring(0, 150)}${skill.description.length > 150 ? '...' : ''}</p>
      <div class="skill-tags">
        ${tagsHTML}
      </div>
      <div class="skill-meta">
        <span class="skill-author">${(skill.authors || []).join(', ')}</span>
        <span class="skill-license">${skill.license}</span>
      </div>
    </div>
  `;
}

/**
 * Generate the overview page (index.html)
 */
function generateOverviewPage(skills, tagMap, changelog) {
  // Group skills by category
  const categories = {};
  skills.forEach(skill => {
    const cat = skill.category || 'Other';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push(skill);
  });

  const categoriesHTML = Object.entries(categories)
    .map(([category, catSkills]) => `
      <section class="category-section">
        <h2 class="category-title">${category.charAt(0).toUpperCase() + category.slice(1)} Skills</h2>
        <div class="skill-grid">
          ${catSkills.map(generateSkillCard).join('')}
        </div>
      </section>
    `)
    .join('');

  // Generate tag cloud
  const tagsHTML = Array.from(tagMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([tag, tagSkills]) => `
      <a href="/tags/${tag}.html" class="tag-cloud-item" data-count="${tagSkills.length}">
        ${tag}
        <span class="tag-count">${tagSkills.length}</span>
      </a>
    `)
    .join('');

  // Generate news section from changelog
  let newsHTML = '';
  if (changelog) {
    newsHTML = `
    <section class="news-section">
      <h2 class="news-title">
        <span>News</span>
        <a href="https://github.com/proophboard/skills/blob/main/CHANGELOG.md" class="news-link" target="_blank" rel="noopener">
          Older news &rsaquo;
        </a>
      </h2>
      <div class="news-date">${changelog.date}</div>
      <div class="news-content markdown-body">
        ${changelog.html}
      </div>
    </section>
    `;
  }

  const content = `
    ${newsHTML}

    <section class="overview-header">
      <h1>Browse Skills</h1>
      <p class="overview-subtitle">A collection of AI agent skills for prooph board</p>
      <div class="skill-count">${skills.length} skills available</div>
    </section>

    <section class="tag-cloud-section">
      <h2>Browse by Tags</h2>
      <div class="tag-cloud">
        ${tagsHTML}
      </div>
    </section>

    ${categoriesHTML}
  `;

  return generateHTML('Browse Skills', content);
}

/**
 * Generate individual skill detail page
 */
function generateSkillPage(skill, zipUrl = null) {
  const tagsHTML = (skill.tags || [])
    .map(tag => `<a href="/tags/${tag}.html" class="tag-link">${tag}</a>`)
    .join('');
  
  // Determine assets base URL for this skill
  const assetsBaseUrl = skill.hasAssets ? `/assets/${skill.relativePath}` : '';
  
  // Render README content
  const renderedReadme = skill.readmeExists
    ? renderMarkdown(skill.readmeContent, assetsBaseUrl)
    : '<p><em>No documentation available yet.</em></p>';

  // Render SKILL.md content
  const renderedSkillMd = skill.skillMdExists
    ? renderMarkdown(skill.skillMdContent, assetsBaseUrl)
    : '<p><em>No SKILL.md available.</em></p>';

  // Download button links to the zip file
  const downloadUrl = zipUrl || `https://github.com/proophboard/skills/tree/main/skills/${skill.relativePath}`;

  const content = `
    <article class="skill-detail">
      <header class="skill-detail-header">
        <div class="skill-detail-title-section">
          <div>
            <h1 class="skill-detail-name">${skill.name}</h1>
            <span class="skill-detail-version">v${skill.version}</span>
          </div>
          <a href="${downloadUrl}" class="download-button" target="_blank">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 10.5l-4-4h2.5V2h3v4.5H12l-4 4zM3 12h10v2H3v-2z"/>
            </svg>
            Download Skill
          </a>
        </div>
        <p class="skill-detail-description">${skill.description}</p>
      </header>

      <div class="skill-detail-meta">
        <div class="meta-item">
          <span class="meta-label">Author</span>
          <span class="meta-value">${(skill.authors || []).join(', ')}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">License</span>
          <span class="meta-value">${skill.license}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Category</span>
          <span class="meta-value">${skill.category}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Element Types</span>
          <span class="meta-value">${(skill.elementTypes || []).join(', ')}</span>
        </div>
        <div class="meta-item tags-meta">
          <span class="meta-label">Tags</span>
          <div class="skill-tags">
            ${tagsHTML}
          </div>
        </div>
      </div>

      <div class="skill-detail-tabs">
        <button class="tab-button active" data-tab="readme" onclick="switchTab('readme', this)">Documentation</button>
        <button class="tab-button" data-tab="skill" onclick="switchTab('skill', this)">SKILL.md</button>
      </div>

      <div class="tab-panel active" id="tab-readme">
        <div class="markdown-body">
          ${renderedReadme}
        </div>
      </div>

      <div class="tab-panel" id="tab-skill">
        <div class="markdown-body">
          ${renderedSkillMd}
        </div>
      </div>
    </article>
  `;

  return generateHTML(`${skill.name}`, content);
}

/**
 * Generate tag page showing all skills with that tag
 */
function generateTagPage(tag, skills) {
  const skillsHTML = skills.map(generateSkillCard).join('');
  
  const content = `
    <section class="tag-page">
      <nav class="breadcrumb">
        <a href="/">Skills</a> &rsaquo; <span class="breadcrumb-current">${tag}</span>
      </nav>
      <h1 class="tag-title">
        <span class="tag-badge">${tag}</span>
        <span class="tag-skill-count">${skills.length} skill${skills.length !== 1 ? 's' : ''}</span>
      </h1>
      <p class="tag-description">Skills tagged with "${tag}"</p>
      <div class="skill-grid">
        ${skillsHTML}
      </div>
    </section>
  `;
  
  return generateHTML(`Tag: ${tag}`, content);
}

/**
 * Copy _assets to dist directory
 */
function copyAssets(skills) {
  skills.forEach(skill => {
    if (skill.hasAssets && skill.assetsDir) {
      const destDir = path.join(DIST_DIR, 'assets', skill.relativePath);
      fs.copySync(skill.assetsDir, path.join(destDir, '_assets'));
    }
  });
}

/**
 * Create zip file for a skill containing only agent-relevant files.
 * Excludes: README.md (user-facing web docs) and _assets/ folder (web images/videos).
 * Includes: skill.json, SKILL.md, and any other files (scripts, references, etc.).
 */
async function createSkillZip(skill) {
  const zipsDir = path.join(DIST_DIR, 'zips');
  await fs.ensureDir(zipsDir);
  
  const zipPath = path.join(zipsDir, `${skill.name}-${skill.version}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);
    archive.pipe(output);
    
    const skillDir = path.join(SKILLS_DIR, skill.relativePath);
    const files = fs.readdirSync(skillDir);
    
    // Excluded files/folders
    const exclude = new Set(['README.md', '_assets']);
    
    for (const file of files) {
      if (exclude.has(file)) continue;
      
      const filePath = path.join(skillDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        archive.file(filePath, { name: file });
      } else if (stat.isDirectory()) {
        // Recursively add directory contents
        const subFiles = fs.readdirSync(filePath);
        for (const subFile of subFiles) {
          const subPath = path.join(filePath, subFile);
          if (fs.statSync(subPath).isFile()) {
            archive.file(subPath, { name: `${file}/${subFile}` });
          }
        }
      }
    }
    
    archive.finalize();
  });
}

/**
 * Main build function
 */
async function build() {
  console.log('Building prooph board Skills website...');
  
  // Clean dist directory
  await fs.remove(DIST_DIR);
  await fs.ensureDir(DIST_DIR);
  
  // Collect skills
  const skills = collectSkills();
  console.log(`Found ${skills.length} skills`);
  
  // Collect tags
  const tagMap = collectTags(skills);
  console.log(`Found ${tagMap.size} unique tags`);
  
  // Create CSS directory
  await fs.ensureDir(path.join(DIST_DIR, 'css'));
  
  // Create skills directory
  await fs.ensureDir(path.join(DIST_DIR, 'skills'));
  
  // Create tags directory
  await fs.ensureDir(path.join(DIST_DIR, 'tags'));
  
  // Copy CSS
  const cssPath = path.join(__dirname, 'styles.css');
  await fs.copy(cssPath, path.join(DIST_DIR, 'css', 'styles.css'));
  console.log('Copied CSS');

  // Download favicon
  const imagesDir = path.join(DIST_DIR, 'images');
  await fs.ensureDir(imagesDir);
  const faviconUrl = LOGO_URL;
  const response = await fetch(faviconUrl);
  const buffer = await response.arrayBuffer();
  await fs.writeFile(path.join(imagesDir, 'favicon.png'), Buffer.from(buffer));
  console.log('Downloaded favicon');
  
  // Generate overview page
  const changelog = getLatestChangelog();
  const overviewHTML = generateOverviewPage(skills, tagMap, changelog);
  await fs.writeFile(path.join(DIST_DIR, 'index.html'), overviewHTML);
  console.log('Generated index.html');
  
  // Generate skill pages and create zips
  const zipUrls = {};
  for (const skill of skills) {
    const zipPath = await createSkillZip(skill);
    const zipUrl = `/zips/${path.basename(zipPath)}`;
    zipUrls[skill.name] = zipUrl;
  }
  
  for (const skill of skills) {
    const skillHTML = generateSkillPage(skill, zipUrls[skill.name]);
    await fs.writeFile(path.join(DIST_DIR, 'skills', `${skill.slug}.html`), skillHTML);
  }
  console.log(`Generated ${skills.length} skill pages`);
  console.log(`Created ${skills.length} skill zips`);
  
  // Generate tag pages
  for (const [tag, tagSkills] of tagMap) {
    const tagHTML = generateTagPage(tag, tagSkills);
    await fs.writeFile(path.join(DIST_DIR, 'tags', `${tag}.html`), tagHTML);
  }
  console.log(`Generated ${tagMap.size} tag pages`);
  
  // Copy assets
  copyAssets(skills);
  console.log('Copied assets');
  
  console.log('Build complete! Output in dist/');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
