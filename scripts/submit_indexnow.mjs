#!/usr/bin/env node

function parseArgs(argv) {
  const args = { url: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) throw new Error(`Unexpected argument: ${value}`);
    const key = value.slice(2);
    if (["dry-run", "no-sitemap"].includes(key)) {
      args[key] = true;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) throw new Error(`Missing value for --${key}`);
    if (key === "url") args.url.push(next);
    else args[key] = next;
    index += 1;
  }
  return args;
}

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) =>
    match[1].replace(/&amp;/g, "&").trim(),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.site) {
    throw new Error(
      "Usage: submit_indexnow.mjs --site https://example.com [--key KEY] [--sitemap URL] [--url URL] [--dry-run]",
    );
  }

  const site = new URL(args.site);
  const key = args.key ?? process.env.INDEXNOW_KEY;
  if (!key) throw new Error("Provide --key or set INDEXNOW_KEY.");
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) throw new Error("The IndexNow key format is invalid.");

  const keyLocation = new URL(args["key-location"] ?? `/${key}.txt`, site);
  const sitemap = args["no-sitemap"] ? null : new URL(args.sitemap ?? "/sitemap.xml", site);
  const urls = [...args.url];

  if (sitemap) {
    const response = await fetch(sitemap, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Sitemap returned ${response.status}: ${sitemap}`);
    urls.push(...sitemapUrls(await response.text()));
  }

  const uniqueUrls = [...new Set(urls.map((value) => new URL(value, site).toString()))];
  if (!uniqueUrls.length) throw new Error("No URLs found. Supply --url or a sitemap.");
  if (uniqueUrls.length > 10000) throw new Error("IndexNow accepts at most 10,000 URLs per request.");
  for (const url of uniqueUrls) {
    if (new URL(url).hostname !== site.hostname) throw new Error(`URL is outside ${site.hostname}: ${url}`);
  }
  if (keyLocation.hostname !== site.hostname) throw new Error("The key file must be hosted on the submitted site.");

  const payload = {
    host: site.hostname,
    key,
    keyLocation: keyLocation.toString(),
    urlList: uniqueUrls,
  };

  if (args["dry-run"]) {
    console.log(JSON.stringify({ ...payload, key: "[redacted]", dryRun: true }, null, 2));
    return;
  }

  const proof = await fetch(keyLocation, { signal: AbortSignal.timeout(15000) });
  if (!proof.ok) throw new Error(`Key proof returned ${proof.status}: ${keyLocation}`);
  if ((await proof.text()).trim() !== key) throw new Error(`Key proof content does not match: ${keyLocation}`);

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });
  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow returned ${response.status}: ${(await response.text()).slice(0, 500)}`);
  }
  console.log(`Submitted ${uniqueUrls.length} URL(s) for ${site.hostname}; IndexNow returned ${response.status}.`);
}

main().catch((error) => {
  console.error(`ERROR ${error.message}`);
  process.exitCode = 1;
});
