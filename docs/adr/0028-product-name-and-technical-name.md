# ADR-0028: Cauce as the Product Name, EAP as the Technical Name

**Date:** 2026-10-07

## Status

Accepted

## Context

The project has carried one name since its first commit: EAP, short for
"Ecosistema de Aprendizaje Personal". That name lives in two very
different places. On one side is everything a learner reads: the tab
title, the sidebar wordmark, the sign-in and onboarding screens, Settings
copy, the subject and body of every email, the metadata a shared link
shows. On the other is everything only the codebase sees: the repository,
the workspace packages, the database and its user, environment variables,
constants such as `EAP_EMAIL_DECLARATIONS`, the browser storage keys
`eap:resource-list-params` and `eap-theme`, and the ADR and CHANGELOG
history that refers to the project by that name.

The product now has a name meant for people rather than for the codebase:
**Cauce**, the bed a river runs through. The tool channels whatever energy
the learner has toward what fits it, and learning follows its course from
there. It comes with a symbol, a circle crossed by a river, and a
wordmark.

A rename can reach as far as either side. Carrying it into the technical
side means touching imports, migrations, environment configuration and
deployment names, with no change a learner would ever notice. Leaving the
user-facing side as EAP keeps an acronym that explains nothing to someone
who doesn't already know what it stands for. The question is where the
line between the two names sits, and what happens to the copy that
currently uses "Ecosystem" as if it were the product's name.

## Decision

### Two names, split by audience

**Cauce** is the product name: everything a learner reads, sees or
receives. **EAP** stays the technical name: everything only the codebase,
its tooling and its contributors see. Neither name leaks into the other's
side.

| Product name: Cauce                                    | Technical name: EAP                               |
| ------------------------------------------------------ | ------------------------------------------------- |
| Tab titles, `<title>`, description and Open Graph tags | Repository and workspace package names            |
| Sidebar, sign-in and onboarding wordmark               | Database name and user, environment variables     |
| Favicon, web app manifest, link preview image          | Code identifiers (`EAP_EMAIL_DECLARATIONS`, etc.) |
| Copy that names the product (Settings, onboarding)     | Browser storage keys (`eap:*`, `eap-theme`)       |
| Email subject, body, wordmark and footer               | Container image names                             |
| API documentation title, once it exists                | ADR, CHANGELOG and wiki history                   |

Browser storage keys stay on the technical side even though they live in
the learner's browser. They are never displayed, and renaming them would
either reset each learner's saved theme and library filters once or
require a read-old-write-new migration to carry them over, for no visible
change.

### Wordmark and descriptor

- Inside the app, the wordmark is **cauce**, lowercase.
- Outside the app (a future landing page, emails, link previews), it is
  **cauce.study**: the domain carries the context the word alone doesn't.
  The domain is available, and registering it belongs to deploy
  preparation. The in-app wordmark doesn't depend on it.
- Next to the wordmark, a descriptor states what the product is:
  **personal learning ecosystem**. It is written in English like the rest
  of the interface, and gets its Spanish form through internationalization
  rather than as a hard-coded exception. It also keeps the origin of the
  EAP acronym visible to anyone who meets it in the codebase.
- In running prose the name is capitalized: "Cauce".

### Copy describes actions, not the brand

Copy that currently uses "Ecosystem" as a stand-in for the product name
("Add to Ecosystem →", "discovery across the EAP Ecosystem", "EAP is an
ecosystem of blocks") is rewritten to say what happens rather than name
the product: "Add to library →", "discovery across your library". The
brand appears where a name belongs (wordmark, titles, emails, onboarding),
not on individual buttons. Where a sentence genuinely refers to the
product, it says Cauce.

### One source for the product name per app

Each app reads the product name from a single constant instead of
repeating the literal. The web app already does this for tab titles
(`APP_NAME`); the same constant feeds the wordmark and metadata. The API
passes the name to its email templates as a variable instead of writing
it into each subject and template. A future change to the name, or to the
external wordmark, touches one place per app.

## Consequences

### Positive

- The rename touches only what a learner can see: no migrations, no
  package or import churn, no configuration changes for anyone running the
  project.
- Contributors and tooling keep one stable identifier across the whole
  history: existing ADRs, CHANGELOG entries, branch names and issues stay
  correct as written.
- Copy that describes actions instead of naming the brand survives any
  future rename unchanged.

### Negative

- Two names coexist, and a newcomer reading the code meets "EAP" while the
  product says "Cauce". The README and `ARCHITECTURE.md` state the
  relationship once, near the top, so it never has to be inferred.
- The boundary needs judgment for new cases. The rule is the one above: if
  a learner can read it, it says Cauce; if only the codebase can, it says
  EAP.

## Rejected Alternatives

- **Full rename, technical side included** — rejected. It means renaming
  packages, the database, environment variables and storage keys, with a
  migration for each, and gives a learner nothing they can see in return.
- **Keep EAP as the product name** — rejected. An acronym of a Spanish
  phrase explains nothing to someone meeting the product for the first
  time, and carries no image the symbol can build on.
- **Rename storage keys with a one-time migration** — rejected. The keys
  are never displayed, and the migration would be code written only to be
  removed later.
- **Use the brand in action copy ("Add to Cauce →")** — rejected. It ties
  every button to the current name and reads as branding where the learner
  only needs to know what the button does.

## References

- ADR-0001: Monorepo with Yarn workspaces (package names)
- ADR-0020: Authentication architecture (sign-in emails)
