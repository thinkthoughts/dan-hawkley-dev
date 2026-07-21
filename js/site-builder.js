(() => {
  const FEED_URL = "/data/latest.json";
  const feed = document.getElementById("latest-projects");
  const toggle = document.getElementById("theme-toggle");
  const homepageTitle =
  document.getElementById("homepage-title") ||
  document.querySelector("main h1");

  function setTheme(theme) {
    const dark = theme === "dark";
    document.body.classList.toggle("dark-mode", dark);
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.textContent = dark ? "☀️ Light" : "🌙 Dark";
    localStorage.setItem("theme", dark ? "dark" : "light");
  }

  setTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");

  toggle.addEventListener("click", () => {
    setTheme(document.body.classList.contains("dark-mode") ? "light" : "dark");
  });

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  }

  function externalLink(url, label, className = "button") {
    if (!url) return "";
    return `<a class="${className}" href="${url}" rel="noopener noreferrer">${label}</a>`;
  }
  function renderHomepageBadges(projects) {
    if (!homepageTitle) return;
  
    const badgeProjects = projects.filter(project => project.badge?.url);
    if (!badgeProjects.length) return;
  
    let titleRow = homepageTitle.closest(".homepage-title-row");
  
    if (!titleRow) {
      titleRow = document.createElement("div");
      titleRow.className = "homepage-title-row";
      homepageTitle.parentNode.insertBefore(titleRow, homepageTitle);
      titleRow.appendChild(homepageTitle);
    }
  
    let badgeRail = titleRow.querySelector(".homepage-badge-rail");
  
    if (!badgeRail) {
      badgeRail = document.createElement("div");
      badgeRail.className = "homepage-badge-rail";
      titleRow.insertBefore(badgeRail, homepageTitle);
    }
  
    badgeRail.innerHTML = badgeProjects.map(project => `
      <a
        class="homepage-badge-link"
        href="${project.primary_url || project.repository?.url || "#"}"
        aria-label="${project.title}"
      >
        <img
          class="homepage-badge"
          src="${project.badge.url}"
          alt="${project.title} badge"
          width="72"
          height="72"
        >
      </a>
    `).join("");
  }

  function renderProject(project, index) {
    const statement = project.engineering_statement || {};
    const repository = project.repository || {};
    const image = project.image || {};
    const statusLabel = project.status_label || "Ready";
    const featuredClass = index === 0 ? " project-card--featured" : "";

    const tags = Array.isArray(project.tags)
      ? project.tags.map(tag => `<span class="tag">${tag}</span>`).join("")
      : "";

    return `
      <article class="project-card${featuredClass}">
        ${image.url ? `
          <a class="project-image-link" href="${repository.url || project.primary_url || "#"}">
            <img
              class="project-image"
              src="${image.url}"
              alt="${image.alt || ""}"
              loading="${index === 0 ? "eager" : "lazy"}"
            >
          </a>
        ` : ""}

        <div class="project-body">
          <div class="project-meta">
            <span class="project-status">${project.status_symbol || "🟢"} ${statusLabel}</span>
            <span>${project.primary_group || "Engineering"}</span>
            <time datetime="${project.timestamp || ""}">${formatDate(project.timestamp)}</time>
          </div>

          <h2>${project.title}</h2>

          ${statement.text ? `
            <p class="engineering-statement">
              ${statement.url
                ? `<a href="${statement.url}" rel="noopener noreferrer">${statement.text}</a>`
                : statement.text}
            </p>
          ` : ""}

          ${project.summary ? `<p class="project-summary">${project.summary}</p>` : ""}

          ${tags ? `<div class="tag-row" aria-label="Project tags">${tags}</div>` : ""}

          <div class="project-actions">
            ${externalLink(repository.url || project.primary_url, "Open project", "button primary")}
            ${externalLink(statement.url, "Engineering statement", "button")}
          </div>
        </div>
      </article>
    `;
  }

  async function buildFeed() {
    try {
      const response = await fetch(FEED_URL, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Feed request failed: ${response.status}`);
      }

      const projects = await response.json();
      if (!Array.isArray(projects)) {
        throw new TypeError("latest.json must contain an array");
      }

      projects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      renderHomepageBadges(projects);

      feed.innerHTML = projects.length
        ? projects.map(renderProject).join("")
        : '<p class="feed-message">No engineering objects have been published yet.</p>';
    } catch (error) {
      console.error(error);
      feed.innerHTML = `
        <p class="feed-message">
          Recent engineering objects could not be loaded.
          <a href="https://github.com/thinkthoughts">Open GitHub instead.</a>
        </p>
      `;
    } finally {
      feed.setAttribute("aria-busy", "false");
    }
  }

  buildFeed();
})();
