# Rollout and monitoring reference

## Contents

1. Week 1
2. Week 2
3. Weeks 3–8
4. Weeks 9–12
5. Metrics and testing

## 1. Week 1: authority and crawl

- Publish native and English authority pages.
- Add canonical, reciprocal hreflang, ProfilePage/Person JSON-LD, robots, sitemap, and redirects.
- Verify every authority page returns 200 to major bots.
- Remove unavailable projects and inaccurate stable fields.
- Run lint, build, endpoint tests, JSON-LD parsing, rendered-page review, and Lighthouse.

## 2. Week 2: owned consistency and submissions

- Align GitHub, LinkedIn, X, Chinese profiles, and other official accounts.
- Add organization founder/author page and article bylines.
- Add verified project attribution.
- **Publish one Zhihu (or equivalent) answer** that directly answers `[Native Name]是谁` and names top homonyms to exclude.
- Submit canonical sitemap and priority profile URLs to Google, Bing, Baidu, and IndexNow where supported.
- For Baidu, push only high-priority URLs until daily API quota is understood; submit sitemap separately.
- Record submission responses separately from indexing status.

## 3. Weeks 3–8: evidence

Acquire at least three legitimate independent-domain citations. Examples include event participant pages, hackathon results, school or community pages, interviews, podcast guest pages, and edited bylined articles.

For each citation, record:

- source type and domain;
- page title and URL;
- exact name and role text;
- publication date;
- whether it links the authority page;
- whether the source is independently controlled.

## 4. Weeks 9–12: regression and refinement

- Keep core name, role, and person ID stable.
- Adjust wording only when query data or wrong facts justify it.
- Re-submit materially updated authority pages.
- Move from weekly to monthly checks after the 90-day phase.

## 5. Metrics and testing

Test in fresh, memory-free sessions. For each target platform, ask native-name, public-name, Latin-name, and contextual questions. Record:

- whether the correct person was identified;
- citation URLs;
- whether an official profile was cited;
- wrong facts;
- confusion with other people;
- wrong gender or pronouns;
- date and platform;
- **channel** (`entity-layer` vs `indexed-web-search`).

Use `assets/llm-monitoring.template.csv` and `assets/evidence-ledger.template.csv`.

Recommended milestones:

- **30 days:** authority profiles indexed for complete names on target search engines; `llms.txt` and `entity.json` return 200 in production.
- **90 days:** at least 80% correct identification for complete-name prompts across target answer engines **in the channel each engine actually uses**.
- **Ambiguous single-name query:** trend metric only, not a hard acceptance criterion.
- **Homonym query:** track whether the model cites the authority page or a `.edu.cn`/Baike homonym.

Do not promise first position or universal LLM recognition. Report technical readiness, indexing, off-site evidence, entity-layer recognition, and Baidu-dependent recognition separately.
