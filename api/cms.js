const NOTION_VERSION = "2022-06-28";

function env(name) {
  return process.env[name] || "";
}

function plainText(value) {
  if (!value) return "";
  if (value.type === "title") return (value.title || []).map((part) => part.plain_text).join("");
  if (value.type === "rich_text") return (value.rich_text || []).map((part) => part.plain_text).join("");
  if (value.type === "url") return value.url || "";
  if (value.type === "number") return value.number ?? "";
  if (value.type === "checkbox") return value.checkbox || false;
  if (value.type === "select") return value.select?.name || "";
  return "";
}

function prop(page, name) {
  return page.properties?.[name];
}

function text(page, name) {
  return String(plainText(prop(page, name)) || "").trim();
}

function number(page, name) {
  const value = plainText(prop(page, name));
  return typeof value === "number" ? value : Number(value || 0);
}

function checked(page, name) {
  return Boolean(plainText(prop(page, name)));
}

function title(page) {
  const firstTitle = Object.values(page.properties || {}).find((item) => item.type === "title");
  return String(plainText(firstTitle) || "").trim();
}

function byOrder(a, b) {
  return (a.order || 999) - (b.order || 999);
}

function splitLines(value) {
  return String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

async function queryDatabase(id) {
  if (!id || !env("NOTION_TOKEN")) return [];
  const response = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("NOTION_TOKEN")}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION
    },
    body: JSON.stringify({ page_size: 100, sorts: [{ property: "Order", direction: "ascending" }] })
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Notion query failed for ${id}: ${response.status} ${detail}`);
  }
  const data = await response.json();
  return data.results || [];
}

function active(page) {
  return !page.properties?.Active || checked(page, "Active");
}

function activeAny(page) {
  if (page.properties?.Active) return checked(page, "Active");
  if (page.properties?.Checkbox) return checked(page, "Checkbox");
  return true;
}

function mapFormats(pages) {
  return pages.filter(active).map((page) => ({
    id: page.id,
    title: title(page),
    name: {
      ru: text(page, "Name RU") || title(page),
      en: text(page, "Name EN") || text(page, "Name RU") || title(page),
      et: text(page, "Name ET") || text(page, "Name RU") || title(page)
    },
    description: {
      ru: text(page, "Description RU"),
      en: text(page, "Description EN") || text(page, "Description RU"),
      et: text(page, "Description ET") || text(page, "Description RU")
    },
    includes: {
      ru: splitLines(text(page, "Includes RU")),
      en: splitLines(text(page, "Includes EN") || text(page, "Includes RU")),
      et: splitLines(text(page, "Includes ET") || text(page, "Includes RU"))
    },
    priceRub: number(page, "Price RUB"),
    priceEur: number(page, "Price EUR"),
    order: number(page, "Order")
  })).sort(byOrder);
}

function mapReviews(pages) {
  return pages.filter(active).map((page) => ({
    id: page.id,
    title: title(page),
    text: {
      ru: text(page, "Text RU"),
      en: text(page, "Text EN") || text(page, "Text RU"),
      et: text(page, "Text ET") || text(page, "Text RU")
    },
    client: text(page, "Client"),
    caption: {
      ru: text(page, "Caption RU"),
      en: text(page, "Caption EN") || text(page, "Caption RU"),
      et: text(page, "Caption ET") || text(page, "Caption RU")
    },
    order: number(page, "Order")
  })).sort(byOrder);
}

function mapApproach(pages) {
  return pages.filter(activeAny).map((page) => ({
    id: page.id,
    number: text(page, "Number") || String(number(page, "Number") || ""),
    title: {
      ru: text(page, "Title RU") || title(page),
      en: text(page, "Title EN") || text(page, "Title RU") || title(page),
      et: text(page, "Title ET") || text(page, "Title RU") || title(page)
    },
    text: {
      ru: text(page, "Text RU"),
      en: text(page, "Text EN") || text(page, "Text RU"),
      et: text(page, "Text ET") || text(page, "Text RU")
    },
    order: number(page, "Order")
  })).sort(byOrder);
}

function mapRequests(pages) {
  return pages.filter(active).map((page) => ({
    id: page.id,
    title: {
      ru: text(page, "Title RU") || title(page),
      en: text(page, "Title EN") || text(page, "Title RU") || title(page),
      et: text(page, "Title ET") || text(page, "Title RU") || title(page)
    },
    items: {
      ru: splitLines(text(page, "Items RU")),
      en: splitLines(text(page, "Items EN") || text(page, "Items RU")),
      et: splitLines(text(page, "Items ET") || text(page, "Items RU"))
    },
    order: number(page, "Order")
  })).sort(byOrder);
}

function mapAnalyses(pages) {
  return pages.filter(active).map((page) => ({
    id: page.id,
    title: {
      ru: text(page, "Title RU") || title(page),
      en: text(page, "Title EN") || text(page, "Title RU") || title(page),
      et: text(page, "Title ET") || text(page, "Text ET") || text(page, "Title RU") || title(page)
    },
    group: text(page, "Group") || "labs",
    fresh: checked(page, "Fresh"),
    order: number(page, "Order")
  })).sort(byOrder);
}

function mapLinks(pages) {
  const links = {};
  pages.filter(active).forEach((page) => {
    const key = (text(page, "Key") || title(page)).trim().toLowerCase();
    if (!key) return;
    links[key] = {
      url: text(page, "URL"),
      label: {
        ru: text(page, "Label RU") || title(page),
        en: text(page, "Label EN") || text(page, "Label RU") || title(page),
        et: text(page, "Label ET") || text(page, "Label RU") || title(page)
      },
      order: number(page, "Order")
    };
  });
  return links;
}

function mapQuestionnaire(pages) {
  return pages.filter(active).map((page) => ({
    id: page.id,
    title: title(page),
    question: {
      ru: text(page, "Question RU") || title(page),
      en: text(page, "Question EN") || text(page, "Question RU") || title(page),
      et: text(page, "Question ET") || text(page, "Question RU") || title(page)
    },
    help: {
      ru: text(page, "Help RU"),
      en: text(page, "Help EN") || text(page, "Help RU"),
      et: text(page, "Help ET") || text(page, "Help RU")
    },
    placeholder: {
      ru: text(page, "Placeholder RU") || "Ваш ответ",
      en: text(page, "Placeholder EN") || text(page, "Placeholder RU") || "Your answer",
      et: text(page, "Placeholder ET") || text(page, "Placeholder RU") || "Sinu vastus"
    },
    order: number(page, "Order")
  })).sort(byOrder);
}

function mapTexts(pages) {
  const texts = {};
  pages.forEach((page) => {
    const key = text(page, "Key");
    if (!key) return;
    if (!active(page)) {
      texts[key] = { ru: "", en: "", et: "", order: number(page, "Order"), disabled: true };
      return;
    }
    texts[key] = {
      ru: text(page, "RU"),
      en: text(page, "EN") || text(page, "RU"),
      et: text(page, "ET") || text(page, "RU"),
      order: number(page, "Order"),
      disabled: false
    };
  });
  return texts;
}

module.exports = async function handler(req, res) {
  try {
    const [formats, reviews, analyses, links, texts, requests, approach, questionnaire] = await Promise.all([
      queryDatabase(env("NOTION_FORMATS_DB_ID")),
      queryDatabase(env("NOTION_REVIEWS_DB_ID")),
      queryDatabase(env("NOTION_ANALYSES_DB_ID")),
      queryDatabase(env("NOTION_LINKS_DB_ID")),
      queryDatabase(env("NOTION_TEXTS_DB_ID")),
      queryDatabase(env("NOTION_REQUESTS_DB_ID")),
      queryDatabase(env("NOTION_APPROACH_DB_ID")),
      queryDatabase(env("NOTION_QUESTIONNAIRE_DB_ID"))
    ]);
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.status(200).json({
      ok: true,
      formats: mapFormats(formats),
      reviews: mapReviews(reviews),
      analyses: mapAnalyses(analyses),
      links: mapLinks(links),
      texts: mapTexts(texts),
      requests: mapRequests(requests),
      approach: mapApproach(approach),
      questionnaire: mapQuestionnaire(questionnaire)
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};
