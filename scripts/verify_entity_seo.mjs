#!/usr/bin/env node

import { readFile } from "node:fs/promises";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) throw new Error(`Unexpected argument: ${value}`);
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function decodeHtml(value = "") {
  const entities = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

function visibleText(html) {
  return decodeHtml(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function firstMatch(html, expression) {
  return decodeHtml(html.match(expression)?.[1] ?? "");
}

function attribute(tag, name) {
  return decodeHtml(tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? "");
}

function linkTags(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
}

function ldJsonBlocks(html) {
  const blocks = [];
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    blocks.push(JSON.parse(match[1]));
  }
  return blocks;
}

function flattenJsonLd(value) {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (!value || typeof value !== "object") return [];
  const graph = Array.isArray(value["@graph"]) ? value["@graph"].flatMap(flattenJsonLd) : [];
  return [value, ...graph];
}

function typeIncludes(node, expected) {
  const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
  return types.includes(expected);
}

function sameUrl(actual, expected) {
  try {
    const normalize = (input) => {
      const url = new URL(input);
      url.hash = "";
      if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/$/, "");
      return url.toString();
    };
    return normalize(actual) === normalize(expected);
  } catch {
    return actual === expected;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.config) throw new Error("Usage: verify_entity_seo.mjs --config /path/to/config.json [--base URL]");

  const config = JSON.parse(await readFile(args.config, "utf8"));
  const siteUrl = new URL(config.siteUrl);
  const baseUrl = new URL(args.base ?? config.siteUrl);
  const timeoutMs = Number(config.timeoutMs ?? 15000);
  const checks = [];

  function record(ok, label, detail = "") {
    checks.push({ ok: Boolean(ok), label, detail });
  }

  function requestUrl(input) {
    const url = new URL(input, siteUrl);
    if (url.origin === siteUrl.origin) {
      url.protocol = baseUrl.protocol;
      url.host = baseUrl.host;
    }
    return url;
  }

  async function fetchChecked(input, init = {}) {
    return fetch(requestUrl(input), {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  for (const page of config.profilePages ?? []) {
    let response;
    let html = "";
    try {
      response = await fetchChecked(page.path);
      html = await response.text();
      record(response.status === 200, `${page.path} returns 200`, `received ${response.status}`);
    } catch (error) {
      record(false, `${page.path} is reachable`, error.message);
      continue;
    }

    const title = firstMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i);
    record(!page.titleIncludes || title.includes(page.titleIncludes), `${page.path} title contains expected identity`, title);

    const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => visibleText(match[1]));
    record(headings.length === 1, `${page.path} has exactly one H1`, `found ${headings.length}`);
    record(!page.h1Includes || headings[0]?.includes(page.h1Includes), `${page.path} H1 contains expected identity`, headings[0] ?? "missing");

    const links = linkTags(html);
    const canonical = links.find((tag) => attribute(tag, "rel").toLowerCase().split(/\s+/).includes("canonical"));
    const canonicalHref = canonical ? attribute(canonical, "href") : "";
    record(canonicalHref && sameUrl(canonicalHref, page.canonical), `${page.path} canonical is correct`, canonicalHref || "missing");

    const hreflangs = new Map(
      links
        .filter((tag) => attribute(tag, "rel").toLowerCase().split(/\s+/).includes("alternate") && attribute(tag, "hreflang"))
        .map((tag) => [attribute(tag, "hreflang"), attribute(tag, "href")]),
    );
    for (const [language, expected] of Object.entries(page.hreflangs ?? {})) {
      record(sameUrl(hreflangs.get(language) ?? "", expected), `${page.path} hreflang ${language} is correct`, hreflangs.get(language) ?? "missing");
    }

    let blocks = [];
    try {
      blocks = ldJsonBlocks(html);
      record(blocks.length > 0, `${page.path} has parseable JSON-LD`, `found ${blocks.length} block(s)`);
    } catch (error) {
      record(false, `${page.path} JSON-LD parses`, error.message);
    }

    const nodes = blocks.flatMap(flattenJsonLd);
    const person = nodes.find((node) => typeIncludes(node, "Person") && node["@id"] === config.personId);
    const profile = nodes.find((node) => typeIncludes(node, "ProfilePage"));
    record(Boolean(profile), `${page.path} has ProfilePage Schema`);
    record(Boolean(person), `${page.path} has Person Schema with canonical @id`, config.personId);

    const text = visibleText(html);
    record(text.includes(config.correctName), `${page.path} visibly states the correct name`, config.correctName);

    const aliases = person ? (Array.isArray(person.alternateName) ? person.alternateName : [person.alternateName].filter(Boolean)) : [];
    for (const misspelling of config.commonMisspellings ?? []) {
      record(!aliases.includes(misspelling), `${page.path} does not claim “${misspelling}” as an alias`);
      record(text.includes(misspelling), `${page.path} visibly disambiguates “${misspelling}”`);
      record(
        typeof person?.disambiguatingDescription === "string" && person.disambiguatingDescription.includes(misspelling),
        `${page.path} Schema disambiguates “${misspelling}”`,
      );
    }
  }

  try {
    const response = await fetchChecked(config.robotsPath ?? "/robots.txt");
    const body = await response.text();
    record(response.status === 200, "robots.txt returns 200", `received ${response.status}`);
    record(/(?:^|\n)\s*Sitemap:\s*https?:\/\//i.test(body), "robots.txt declares a sitemap");
  } catch (error) {
    record(false, "robots.txt is reachable", error.message);
  }

  try {
    const response = await fetchChecked(config.sitemapPath ?? "/sitemap.xml");
    const body = await response.text();
    const urls = [...body.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => decodeHtml(match[1]));
    record(response.status === 200, "sitemap.xml returns 200", `received ${response.status}`);
    if (Number.isInteger(config.expectedSitemapUrlCount)) {
      record(urls.length === config.expectedSitemapUrlCount, "sitemap URL count is exact", `found ${urls.length}`);
    }
    for (const url of urls) {
      record(new URL(url).origin === siteUrl.origin, `sitemap URL uses canonical host: ${url}`);
      try {
        const target = await fetchChecked(url);
        record(target.status === 200, `sitemap URL returns 200: ${url}`, `received ${target.status}`);
      } catch (error) {
        record(false, `sitemap URL is reachable: ${url}`, error.message);
      }
    }
  } catch (error) {
    record(false, "sitemap.xml is reachable", error.message);
  }

  if (config.llmsPath !== false) {
    try {
      const response = await fetchChecked(config.llmsPath ?? "/llms.txt");
      const body = await response.text();
      record(response.status === 200, "llms.txt returns 200", `received ${response.status}`);
      record(body.includes(config.correctName), "llms.txt states the correct name");
      record(/\[[^\]]+\]\(https?:\/\/[^)]+\)/.test(body), "llms.txt uses Markdown links");
      for (const misspelling of config.commonMisspellings ?? []) {
        record(body.includes(misspelling), `llms.txt disambiguates “${misspelling}”`);
      }
    } catch (error) {
      record(false, "llms.txt is reachable", error.message);
    }
  }

  for (const redirect of config.legacyRedirects ?? []) {
    try {
      const response = await fetchChecked(redirect.from, { redirect: "manual" });
      const location = response.headers.get("location") ?? "";
      const resolved = location ? new URL(location, new URL(redirect.from, siteUrl)).toString() : "";
      record([301, 308].includes(response.status), `${redirect.from} redirects permanently`, `received ${response.status}`);
      record(sameUrl(resolved, new URL(redirect.to, siteUrl).toString()), `${redirect.from} redirects to ${redirect.to}`, resolved || "missing location");
    } catch (error) {
      record(false, `${redirect.from} redirect is testable`, error.message);
    }
  }

  const botTarget = config.profilePages?.[0]?.path;
  for (const bot of config.bots ?? []) {
    if (!botTarget) break;
    try {
      const response = await fetchChecked(botTarget, { headers: { "user-agent": bot } });
      record(response.status === 200, `${bot} receives 200`, `received ${response.status}`);
    } catch (error) {
      record(false, `${bot} can reach the authority page`, error.message);
    }
  }

  for (const check of checks) {
    const detail = check.detail ? ` — ${check.detail}` : "";
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.label}${detail}`);
  }
  const failures = checks.filter((check) => !check.ok);
  console.log(`\n${checks.length - failures.length}/${checks.length} checks passed.`);
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`ERROR ${error.message}`);
  process.exitCode = 1;
});
