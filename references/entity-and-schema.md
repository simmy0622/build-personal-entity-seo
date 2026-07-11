# Entity model and Schema reference

## Contents

1. Single fact source
2. Authority-page content
3. JSON-LD graph
4. Relationship rules
5. Temporal facts
6. Failure patterns

## 1. Single fact source

Use one internal object to generate visible profile content, metadata, JSON-LD, `llms.txt`, and external profile copy. Keep verified and unavailable projects distinct.

Required conceptual fields:

```text
personId
siteUrl
names.primary
names.native
names.latin
names.aliases[]
names.commonMisspellings[]
names.notConfusedWith[]   // homonyms / near-names; never feed alternateName
gender.schema
gender.pronouns
headline[locale]
shortBio[locale]
longBio[locale]
officialProfiles[]
organizations[]
verifiedProjects[]
datedExperience[]
education.status[locale]
updatedAt
```

`commonMisspellings` must not automatically feed `alternateName`.

## 2. Authority-page content

The native-language page should use the native name as its primary search signal. A useful sequence is:

1. role label;
2. H1 with native name and primary public name;
3. Latin or alternate name;
4. one-sentence answer to “Who is this?”;
5. founded organization;
6. verified work;
7. dated experience and precise education status;
8. official profiles and contact;
9. updated date and language link.

Use an absolute title only when exact ordering matters. Keep titles concise and consistent with visible content.

## 3. JSON-LD graph

Adapt this graph from the fact source:

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": "https://example.com/about#profile-page",
      "url": "https://example.com/about",
      "inLanguage": "zh-CN",
      "dateModified": "2026-01-15",
      "mainEntity": { "@id": "https://example.com/#person" }
    },
    {
      "@type": "Person",
      "@id": "https://example.com/#person",
      "name": "Example Name",
      "alternateName": ["示例姓名", "Example Latin Name"],
      "url": "https://example.com/about",
      "mainEntityOfPage": "https://example.com/about",
      "description": "Verified biography matching visible copy.",
      "disambiguatingDescription": "Optional concise and factual clarification.",
      "sameAs": [
        "https://github.com/example",
        "https://www.linkedin.com/in/example/"
      ],
      "worksFor": { "@id": "https://example.org/#organization" }
    },
    {
      "@type": "Organization",
      "@id": "https://example.org/#organization",
      "name": "Example Organization",
      "url": "https://example.org",
      "founder": { "@id": "https://example.com/#person" }
    }
  ]
}
```

Localize the ProfilePage name, description, language, and visible H1. Keep the Person ID unchanged across languages.

## 4. Relationship rules

Use:

- `ProfilePage.mainEntity -> Person`;
- `Organization.founder -> Person`;
- `Person.worksFor -> Organization` when current and true;
- `Article.author -> Person` for real authorship;
- `Person.sameAs -> official external identity profile`.

Do not use `sameAs` for:

- an organization founded by the person;
- the site's own profile or machine-readable files;
- press coverage or project pages;
- another person with a similar name.

Use `subjectOf` or visible citations for coverage if needed. A founded organization is a relationship, not an alias.

## 5. Temporal facts

Prefer dated visible timelines for internships, roles, and projects. Avoid encoding temporary experience as permanent `jobTitle` or `worksFor`. Do not use `alumniOf` for an admission or future enrollment. Avoid age as a stable Schema field unless the page is generated from a birth date and disclosure is intentional.

## 6. Failure patterns

- Schema claims not visible on the page.
- Several Person IDs for the same person.
- Different biographies across languages or profiles.
- Dead projects listed as verified work.
- Organization URLs in Person `sameAs`.
- Huge negative disambiguation lists that create unwanted co-occurrence.
- **Assuming a successful deploy** without checking production `/llms.txt` and `/entity.json` for 200.
- **Adding serverless routes** on quota-limited hosts without verifying the full deployment still succeeds.
- SPA routes that never update canonical or title, so every deep link looks like the homepage.
- Core facts changing every week.
- Fake independent citations or directory spam.
