# Chinese-name search and Baidu reference

## Contents

1. Native-name priority
2. Common misspellings
3. Homonyms and near-names
4. Baidu host and submission
5. Zhihu and Chinese social profiles
6. Cross-site Chinese evidence
7. Anti-patterns

## 1. Native-name priority

For a Chinese authority page, put the correct Chinese name first in the title, H1, and first sentence. Keep an English-first homepage or English profile if that reflects the public brand.

Recommended pattern:

```text
Title: 正确中文名（Public Name / Latin Name）- Stable role
H1: 正确中文名（Public Name）
First sentence: 正确中文名（Public Name，英文名 Latin Name）是……
```

Do not stuff all variants into the title. Baidu recommends concise titles that accurately describe the page and use a core term with limited modifiers:

- https://ziyuan.baidu.com/college/articleinfo?id=2726

## 2. Common misspellings

A typo can also be another real person's name. Treat it as a correction, not an identity alias.

Use one visible sentence:

```text
我的中文名是“正确中文名”——“字义提示一”的“字一”，“字义提示二”的“字二”。“常见误写”是中文搜索中的常见误写；如果你在找 [role/context]，正确写法是“正确中文名”。
```

Then use a concise Schema clarification:

```text
[Public Name] 的中文名是 [正确中文名]；[常见误写] 是常见误写，不是正式别名。
```

Keep the typo out of `alternateName`. Do not create `/typo-name`, `/correct-name`, or dozens of query pages. Repeat the correction once on a real founder/author page when an organization relationship exists.

Monitor both the ambiguous query and contextual queries such as:

```text
常见误写
常见误写 Organization
常见误写 Public Name
正确中文名
正确中文名 Organization
```

## 3. Homonyms and near-names

A misspelling is not the only disambiguation problem. Search may return **other real people** with the same or similar names.

Common patterns:

| Pattern | Why it ranks | What to do |
|---------|--------------|------------|
| Same Chinese name on `.edu.cn` admission lists | Official domain, exact character match | State on `/about` and `llms.txt` that the founder is not that student; cite distinguishing facts (organization, city, projects) |
| Singer/celebrity with similar English stage name | Phonetic match (`[Stage Name]` vs `[Public Name]`) | Name the homonym once; say English spellings differ |
| Similarly named brand or media outlet | Brand proximity | Clarify organization relationship; do not claim their names as aliases |

Add a visible **"common confusions (not the same person)"** section with 2–4 high-impact cases only. Mirror the same facts in `disambiguatingDescription` and `llms.txt`. Do not put homonyms in `alternateName`.

For Baidu-dependent LLMs (DeepSeek, 豆包, Kimi 联网), indexed long-form Chinese content matters more than `llms.txt`. A Zhihu answer titled like `[正确中文名]是谁？和 [Homonym] 是同一个人吗？` is often the fastest off-site fix.

## 4. Baidu host and submission

Choose one canonical HTTPS host. Verify the actual host users should visit. Submit final URLs, not redirecting `www` or legacy URLs.

Baidu supports API, sitemap, and manual submission. API submission generally discovers new URLs faster; submission does not guarantee indexing:

- https://ziyuan.baidu.com/college/articleinfo?id=3329
- https://ziyuan.baidu.com/college/articleinfo?id=3076

If Baidu verification requires a temporary `www` root response:

1. keep the verification file 200;
2. keep canonical metadata on the apex host;
3. restore the `www` root redirect after verification;
4. submit only apex canonical URLs.

Use Search Resource Platform to inspect crawl diagnostics, indexing, and query impressions. When available, configure site name, description, logo, and subject in site properties:

- https://ziyuan.baidu.com/property/index

Never place the Baidu API token in client code, public repositories, or a public skill. Rotate tokens if they appear in chat logs or commits.

Operational notes from production:

- **`www` and apex are separate sites** in Baidu Search Resource Platform. Verify both; use the correct token per host.
- **API push quota** on unregistered sites is small (on the order of ~10 URLs/day). Push authority pages first; do not dump the full sitemap in one day.
- **Sitemap submit**, **manual URL submit**, and **API push** are different channels. Use all three; none guarantees indexing.
- **Middleware exceptions** may be required so verification files and the verification host root stay HTTP 200 during HTML-tag verification.
- Trim environment-based site URLs before generating sitemaps. Trailing newlines in env vars produce invalid `<loc>` values.

## 5. Zhihu and Chinese social profiles

Zhihu pages may show captchas to automated browsers while the public member API still returns JSON:

```bash
curl -s "https://www.zhihu.com/api/v4/members/{url_token}" | jq '.headline,.gender,.name'
```

Profile headline requirements for Chinese entity SEO:

- include the **correct Chinese name**;
- include role and founded organization when true;
- include the **canonical personal URL** (`https://`, not `http://`);
- state **gender in visible text**, not only in account settings;
- avoid English-only one-liners if the target query is Chinese.

Prefer the display name pattern `正确中文名 PublicName` when the account slug is Latin-only.

A one-line bio helps consistency; a **substantive indexed answer** helps DeepSeek-style retrieval far more.

## 6. Cross-site Chinese evidence

Useful owned evidence includes:

- a real organization founder/author page;
- article bylines linking the canonical person profile;
- a complete Zhihu or other Chinese profile;
- project “created by” attribution;
- one substantive article introducing the organization or work.

Use the same correct name, public name, role, and canonical URL. Self-controlled sources help consistency but are not independent authority.

## 7. Anti-patterns

- `meta keywords` as a strategy.
- Typo keywords repeated in every heading or page.
- A typo added as an official alias without real usage.
- Long lists of unrelated names in visible content or Schema.
- Redirecting URLs submitted to Baidu.
- `www` and apex both serving indexable homepages indefinitely.
- Assuming `llms.txt` improves traditional Baidu ranking or fixes DeepSeek 联网 answers before indexing.
- Assuming partial LLM success means all Chinese answer engines are solved.
- English-only Zhihu headlines for Chinese-name queries.
- Creating Baike/Wikipedia/Wikidata entries without independent notability.
