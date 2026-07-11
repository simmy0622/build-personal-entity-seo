---
name: build-personal-entity-seo
description: Build, audit, and improve a person's search-engine and LLM entity visibility across a personal website, bilingual profile pages, structured data, social profiles, organization sites, and indexing systems. Use for personal SEO, name/entity disambiguation, homonym confusion (同名/近音), knowledge-graph consistency, AI search visibility, ProfilePage/Person JSON-LD, llms.txt, gender/pronoun correction, Google/Bing/Baidu submission, common name misspellings, canonical/hreflang/sitemap/robots work, cross-site author attribution, Zhihu/中文社交简介优化, DeepSeek/豆包/Kimi recognition gaps, or 30/90-day recognition monitoring.
---

# Build Personal Entity SEO

Create a verifiable person entity that search engines and answer engines can resolve across names, languages, websites, and profiles. Optimize for correct identification and citations, not guaranteed rankings.

## Critical mental model: two visibility channels

Do not treat "LLM can answer correctly" and "Chinese web-search LLM can answer correctly" as one problem.

| Channel | Who uses it | What they read | Typical failure |
|---------|-------------|----------------|-----------------|
| **Entity layer** | ChatGPT, Claude, some agents, crawlers that fetch `llms.txt` | `llms.txt`, JSON-LD, `/about`, `entity.json` | Missing files, deploy 404, inconsistent facts |
| **Indexed web search** | DeepSeek, 豆包, Kimi (联网), Perplexity-style retrieval | Baidu/Bing indexed HTML, Zhihu, `.edu.cn`, Baike | Site not indexed; homonyms outrank you |

**Lesson:** A perfect `llms.txt` does **not** fix DeepSeek if Baidu has not indexed the authority page. Report channel readiness separately in every audit.

## Choose the operating mode

- **Audit/report:** Inspect live and local state. Do not change files, deploy, submit URLs, or edit external profiles.
- **Implement:** Modify the in-scope site, validate, and deploy only when deployment is authorized.
- **Monitor:** Re-run search and LLM tests without memory, split by channel above.

Prefer the live site for crawl and rendering evidence. Preserve dirty worktrees and unrelated user changes.

## Workflow

### 1. Establish verified facts

Collect only facts supported by the person or public evidence:

- canonical person ID;
- primary, native-script, Latin-script, and genuinely used names;
- stable role and short bilingual biography;
- **gender and English pronouns when disambiguation matters**;
- verified projects and organizations;
- official identity profiles;
- dated experience and education wording;
- contact method and update date;
- **known homonyms and near-names to exclude** (same Chinese characters, phonetic lookalikes, similar brands).

Mark unavailable projects as inactive. Do not expose dead links or add them to Schema. Do not turn admission into `alumniOf`, temporary experience into a permanent role, or age into a stable entity field.

Copy `assets/entity-profile.template.json` and fill it as the single fact source. Never invent biography, education, employment, awards, or independent coverage.

**Gender lesson:** Some English nicknames are often inferred as the wrong gender. If wrong-gender answers appear, add `gender` in JSON-LD (`https://schema.org/Male` or `Female`), state gender in `llms.txt`, use **他/她** or **he/him** in visible bios, and mirror the same wording on Zhihu/X/LinkedIn. Do not rely on a platform's hidden gender setting alone.

### 2. Select a canonical identity architecture

Use one stable person identifier, normally:

```text
https://example.com/#person
```

Create one authority page per real language URL, for example `/about` and `/en/about`. Each page must have:

- HTTP 200 and server-rendered identity content;
- one H1;
- self-referencing canonical;
- reciprocal hreflang plus `x-default`;
- a first paragraph that directly answers who the person is;
- projects, dated background, official profiles, contact, and update date;
- visible copy consistent with JSON-LD;
- optional **"common confusions (not the same person)"** section when homonyms pollute search.

**UI vs machine-readable lesson:** It is valid to hide a homepage "About" link for brand minimalism while keeping `/about` indexable, in sitemap, and linked from `llms.txt` / cross-site JSON-LD. Never noindex the authority page to hide it.

Read `references/entity-and-schema.md` before defining the data model or JSON-LD.

### 3. Build the entity graph

Emit `ProfilePage -> Person` JSON-LD on authority pages. Connect a founded organization with:

```text
Organization.founder -> Person @id
```

Use `sameAs` only for real identity profiles on other platforms. Do not put organizations, the site's own pages, `llms.txt`, OpenAPI files, or unrelated coverage into `Person.sameAs` on the **personal** authority page.

On a **founded-organization** site, linking the person's canonical profile URLs in embedded Person JSON-LD can help cross-domain resolution. Keep that graph consistent with the personal site's Person `@id`.

Ship a static `entity.json` and/or `llms.txt` on both personal and organization domains when possible. Prefer static files plus rewrite rules over extra serverless functions.

**Deployment lesson (Vercel Hobby):** Hitting the serverless function limit can fail the entire deploy while leaving stale production. After adding API routes, confirm deployment succeeded and that `/llms.txt` and `/entity.json` return **200**, not 404 from a previous good build.

Keep inactive projects out of visible outbound links and structured data until their URLs return 200.

### 4. Handle multilingual names, misspellings, and homonyms safely

If the target includes Chinese search, homophones, transliterations, common misspellings, or **same-name different people**, read `references/chinese-search.md`.

Rules:

- Keep the correct native name first on the native-language profile page.
- Put only official or genuinely used aliases in `alternateName`.
- Explain a common misspelling once in useful visible prose.
- Put the correction in `disambiguatingDescription`, not in `alternateName`.
- Add a short **not-the-same-as** list for real homonyms that rank in search (e.g. same Chinese name on a `.edu.cn` admission list, a singer with a similar English stage name, a similarly named media brand). State why each is different; keep the list to a few high-impact cases.
- Repeat the same short correction on a real organization author page or another relevant owned source.
- Never create typo doorway pages, keyword-stuffed titles, or long lists of unrelated people.

**Homonym lesson:** Baidu often ranks `.edu.cn` admission PDFs and Baike for the exact Chinese name. A phonetically similar English name (e.g. `[Stage Name]` vs `[Public Name]`) can hijack queries like `[domain][Native Name]`. Explicit negative disambiguation in `/about`, `llms.txt`, and an indexed Zhihu answer beats hoping the model will guess.

### 5. Fix crawl and index hygiene

Ensure:

- `robots.txt` allows public content and blocks only non-content endpoints;
- sitemap contains canonical, indexable content URLs with real modification dates;
- canonical host is consistent across metadata, sitemap, redirects, and submissions;
- HTTP, `www`, and retired domains redirect permanently to the canonical host;
- verification files remain accessible when required (middleware may need exceptions for `/` and `baidu_verify_*.html` on the verification host);
- legacy content routes redirect to the closest relevant page;
- all major search and answer-engine bots receive 200 on authority pages;
- env-based site URLs are **trimmed** before sitemap generation (trailing newlines break `<loc>` URLs).

Treat `llms.txt` as a machine-readable summary for entity-capable systems, not a Baidu ranking lever. Use Markdown links. Including `llms.txt` in the HTML sitemap is optional; some teams add it for discovery.

**SPA lesson:** Client-routed article or profile views need runtime updates to `document.title`, canonical, and OG tags, or every shared URL will look like the homepage to crawlers and social previews.

### 6. Build cross-site evidence

Prioritize evidence in this order:

1. canonical personal profile;
2. founded organization site with founder in JSON-LD (front-end may de-emphasize founder; machine layer keeps facts);
3. official social and developer profiles with the same name, bio, and website;
4. **one substantive Chinese Q&A or article** (Zhihu answer > one-line bio for Baidu-dependent LLMs);
5. verified project attribution;
6. independent editorial or event citations.

Self-controlled sites improve consistency but do not count as independent notability. Seek at least three legitimate independent domains over 90 days. Do not create fake news, spam directories, bulk doorway pages, or premature Wikipedia/Wikidata entries.

**Zhihu lesson:** Profile pages may block automated browsers but the public API often exposes `headline` and `gender`. A good headline must include the **Chinese name**, role, canonical URL, and gender in text—not English-only one-liners. Example pattern:

```text
示例姓名（男）· Example Public Name · [Organization] 创始人 · example.com
```

Nickname should lead with the native name when Chinese search is a goal.

### 7. Submit and monitor

Submit only final canonical URLs. If a verification host temporarily returns 200, restore its redirect after verification and submit the canonical host.

- Use Google Search Console, Bing Webmaster Tools, and Baidu Search Resource Platform where available.
- Use IndexNow for supported engines with `scripts/submit_indexnow.mjs`.
- For Baidu, treat **API push**, **sitemap**, and **manual URL submit** as separate channels. API push has a small daily quota on unregistered sites; prioritize authority pages first. **`www` and apex are separate sites**—verify both, use each host's token, and never push apex URLs with a `www` token.
- Keep credentials in environment variables. Never embed search-console, Baidu push, or IndexNow secrets in public files other than the required public key proof. Rotate tokens if exposed in chat or commits.

Read `references/rollout-and-monitoring.md` before planning submissions or recognition testing.

## Validation gates

Before deployment:

1. Run the repository's lint and production build.
2. Copy `assets/entity-seo.config.template.json`, configure it, and run:

```bash
node scripts/verify_entity_seo.mjs --config /path/to/entity-seo.json --base http://localhost:3000
```

3. Parse every JSON-LD block as JSON.
4. Confirm visible text and Schema state the same facts.
5. Run Lighthouse SEO on each authority-page template.
6. Inspect the rendered mobile page and language switch.
7. **curl production** `/llms.txt`, `/entity.json`, and authority pages for 200 after deploy.

After deployment, rerun the verifier against production and confirm redirects, certificate coverage, and deployment status. Record indexing and LLM results; do not treat successful URL submission as successful indexing.

## Recognition testing (split by channel)

Test in fresh, memory-free sessions. Record platform, date, query, cited URLs, wrong person, wrong gender, and homonym confusion.

**Entity-layer prompts** (should work once files are live):

```text
Who is [Native Name] / [Public Name]?
What is [Public Name]'s Chinese name?
Who founded [Organization]?
```

**Baidu-dependent prompts** (may fail until indexed + Zhihu evidence):

```text
[Native Name]是谁
[Public Name][Native Name]
[Native Name] [Organization] 创始人
```

**Disambiguation prompts** (run when homonyms are known):

```text
[Native Name] 是男是女
[Native Name] 和 [Homonym] 是同一个人吗
[Public Name][Native Name]
[domain-slug][Native Name]
```

Do not promise first position or universal LLM recognition. Report technical readiness, Baidu indexing, off-site evidence, entity-layer LLM results, and web-search LLM results separately.

## Public resources

- `scripts/verify_entity_seo.mjs`: deterministic endpoint, metadata, Schema, sitemap, redirect, and bot checks.
- `scripts/submit_indexnow.mjs`: verify an IndexNow key and submit sitemap or explicit URLs.
- `references/entity-and-schema.md`: entity model, JSON-LD graph, sameAs rules, and content patterns.
- `references/chinese-search.md`: Chinese names, typo correction, homonyms, Baidu host/submission, Zhihu, and anti-spam guidance.
- `references/rollout-and-monitoring.md`: 30/90-day rollout, metrics, evidence, and LLM testing.
- `assets/`: editable fact, verifier, monitoring, and evidence templates.
