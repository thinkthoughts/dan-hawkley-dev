"use strict";

const REPOSITORIES_URL = "/data/repos.json";

const GROUP_ORDER = [
  "operating",
  "reference",
  "evidence",
  "experiment",
  "archive",
  "unmapped"
];

const GROUP_LABELS = {
  operating: "Operating Repositories",
  reference: "Reference Repositories",
  evidence: "Engineering Evidence",
  experiment: "Experiments",
  archive: "Archive",
  unmapped: "To Be Located"
};

let allRepositories = [];

document.addEventListener("DOMContentLoaded", () => {
  initializeThemeToggle();
  initializeRepositoryMap();
});

async function initializeRepositoryMap() {
  const root = document.querySelector("[data-repositories-root]");
  const search = document.querySelector("[data-repository-search]");

  if (!root) {
    return;
  }

  try {
    const payload = await loadJson(REPOSITORIES_URL);
    allRepositories = validateRepositories(payload);

    renderRepositoryMap(root, allRepositories);

    if (search) {
      search.addEventListener("input", () => {
        const query = search.value.trim().toLowerCase();
        const filtered = filterRepositories(allRepositories, query);
        renderRepositoryMap(root, filtered, query);
      });
    }
  } catch (error) {
    console.error("Unable to build repository map:", error);
    renderError(root, error);
  }
}

async function loadJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Unable to load repository data: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

function validateRepositories(payload) {
  if (!payload || typeof payload !== "object") {
    throw new TypeError("Repository data must be a JSON object.");
  }

  if (!Array.isArray(payload.repositories)) {
    throw new TypeError(
      'Repository data must contain a "repositories" array.'
    );
  }

  return payload.repositories.filter((repository) => {
    return Boolean(
      repository &&
      typeof repository === "object" &&
      typeof repository.id === "string" &&
      typeof repository.name === "string"
    );
  });
}

function filterRepositories(repositories, query) {
  if (!query) {
    return repositories;
  }

  return repositories.filter((repository) => {
    return collectSearchText(repository).includes(query);
  });
}

function collectSearchText(repository) {
  const values = [
    repository.name,
    repository.title,
    repository.description,
    repository.group,
    repository.lifecycle,
    ...(repository.badges || []),
    ...(repository.domains || []),
    ...(repository.capabilities || []),
    ...(repository.supports || [])
  ];

  return values
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function renderRepositoryMap(root, repositories, query = "") {
  root.replaceChildren();
  root.setAttribute("aria-busy", "false");

  root.append(createSummary(repositories, query));

  const grouped = groupRepositories(repositories);

  for (const groupName of GROUP_ORDER) {
    const repositoriesInGroup = grouped.get(groupName) || [];

    if (repositoriesInGroup.length === 0) {
      continue;
    }

    root.append(
      createRepositoryGroup(groupName, repositoriesInGroup)
    );
  }

  if (repositories.length === 0) {
    root.append(
      createElement("p", {
        className: "page-status",
        textContent: "No repositories match this search."
      })
    );
  }
}

function createSummary(repositories, query) {
  const section = createElement("section", {
    className: "repository-summary"
  });

  const message = query
    ? `${repositories.length} matching repositories`
    : `${repositories.length} repositories`;

  section.append(
    createElement("p", {
      className: "repository-summary-count",
      textContent: message
    })
  );

  return section;
}

function groupRepositories(repositories) {
  const grouped = new Map();

  for (const repository of repositories) {
    const group = repository.group || "unmapped";

    if (!grouped.has(group)) {
      grouped.set(group, []);
    }

    grouped.get(group).push(repository);
  }

  for (const group of grouped.values()) {
    group.sort((left, right) => {
      return getTitle(left).localeCompare(
        getTitle(right),
        undefined,
        { sensitivity: "base" }
      );
    });
  }

  return grouped;
}

function createRepositoryGroup(groupName, repositories) {
  const section = createElement("section", {
    className: "repository-group",
    attributes: {
      "data-repository-group": groupName
    }
  });

  const headingId = `repository-group-${groupName}`;

  section.setAttribute("aria-labelledby", headingId);

  const heading = createElement("div", {
    className: "section-heading"
  });

  heading.append(
    createElement("h2", {
      id: headingId,
      textContent: GROUP_LABELS[groupName] || formatLabel(groupName)
    }),
    createElement("span", {
      className: "repository-count",
      textContent: String(repositories.length)
    })
  );

  const grid = createElement("div", {
    className: "repository-grid"
  });

  for (const repository of repositories) {
    grid.append(createRepositoryCard(repository));
  }

  section.append(heading, grid);

  return section;
}

function createRepositoryCard(repository) {
  const article = createElement("article", {
    className: "repository-card"
  });

  const title = createElement("h3", {
    className: "repository-title"
  });

  const link = createElement("a", {
    textContent: getTitle(repository),
    attributes: {
      href: repository.repository_url || "#"
    }
  });

  if (repository.repository_url) {
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noreferrer");
  }

  title.append(link);

  const description = createElement("p", {
    className: "repository-description",
    textContent:
      repository.description ||
      "Description and engineering position remain to be specified."
  });

  article.append(title, description);

  const badges = collectBadges(repository);

  if (badges.length > 0) {
    article.append(createBadgeList(badges));
  }

  if (
    Array.isArray(repository.next_steps) &&
    repository.next_steps.length > 0
  ) {
    const nextStep = createElement("p", {
      className: "repository-next-step"
    });

    nextStep.append(
      createElement("strong", {
        textContent: "Next: "
      }),
      document.createTextNode(
        repository.next_steps.map(formatLabel).join(" · ")
      )
    );

    article.append(nextStep);
  }

  return article;
}

function collectBadges(repository) {
  const values = [];

  if (repository.lifecycle) {
    values.push(repository.lifecycle);
  }

  for (const field of ["badges", "domains", "capabilities"]) {
    if (!Array.isArray(repository[field])) {
      continue;
    }

    for (const value of repository[field]) {
      if (typeof value === "string" && value.trim()) {
        values.push(value.trim());
      }
    }
  }

  return [...new Set(values)];
}

function createBadgeList(badges) {
  const list = createElement("ul", {
    className: "repository-badges",
    attributes: {
      "aria-label": "Repository badges"
    }
  });

  for (const badge of badges) {
    list.append(
      createElement("li", {
        className: "repository-badge",
        textContent: formatLabel(badge)
      })
    );
  }

  return list;
}

function renderError(root, error) {
  root.replaceChildren();
  root.setAttribute("aria-busy", "false");

  root.append(
    createElement("section", {
      className: "page-error",
      attributes: {
        role: "alert"
      },
      children: [
        createElement("h2", {
          textContent: "Repository map unavailable"
        }),
        createElement("p", {
          textContent:
            "Confirm that /data/repos.json exists and contains valid JSON."
        }),
        createElement("pre", {
          textContent:
            error instanceof Error ? error.message : String(error)
        })
      ]
    })
  );
}

function getTitle(repository) {
  return repository.title || formatLabel(repository.name);
}

function formatLabel(value) {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function createElement(tagName, options = {}) {
  const element = document.createElement(tagName);

  if (options.id) {
    element.id = options.id;
  }

  if (options.className) {
    element.className = options.className;
  }

  if (options.textContent !== undefined) {
    element.textContent = options.textContent;
  }

  if (options.attributes) {
    for (const [name, value] of Object.entries(options.attributes)) {
      element.setAttribute(name, String(value));
    }
  }

  if (options.children) {
    element.append(...options.children);
  }

  return element;
}

function initializeThemeToggle() {
  const root = document.documentElement;
  const toggle = document.querySelector("[data-theme-toggle]");

  if (!toggle) {
    return;
  }

  toggle.addEventListener("click", () => {
    const currentTheme = root.dataset.theme || "light";
    root.dataset.theme = currentTheme === "dark" ? "light" : "dark";
  });
}
