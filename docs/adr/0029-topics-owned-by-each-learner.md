# ADR-0029: Topics Owned by Each Learner

**Date:** 2026-10-08

## Status

Accepted

## Context

Topics are the tags a learner puts on resources: every resource carries at
least one, the library filters by them, and the dashboard colors cards and
widgets after them. Capturing a resource requires choosing a topic
(ADR-0013).

Topics are also the one part of the learning-resource model that belongs to
nobody. The `topics` table has no owner column, `GET /topics` returns the
same list to every learner, and the only way a topic comes into existence
is the seed script. There is no way to create, rename, recolor or delete
one.

Adding that lifecycle to the table as it stands would break the data
isolation the rest of the model already has. Resources, learning paths,
Pomodoro sessions and the recommendation context are all scoped to their
owner (ADR-0026). A shared topic list would let one learner rename or
delete a tag that every other learner's resources depend on, and deleting a
topic removes it from every resource that uses it, whoever owns that
resource. With the product about to be shared with its first outside
learners, that is not acceptable.

Two further problems come with the current shape:

- **Color.** A topic's color is stored as a hex string. It looks the same in
  the light and the dark theme, ignores the tones the rest of the interface
  is built from, and has no way to follow a future theme that redefines the
  palette.
- **A learner's first topic.** Once topics belong to each learner, a new
  account has none, and a resource can't be captured without one.

## Decision

### Every topic belongs to one learner

`Topic` gains an owner, `userId`. Every topic read and write is scoped to
the current user, in the same way as resources. Two topics of the same
learner can't share a name, compared without regard to case. Different
learners can use the same name freely.

Attaching topics to a resource checks ownership as well as existence: a
topic id that belongs to another learner is rejected exactly like one that
doesn't exist, so the response never reveals that someone else's topic is
there.

### A topic's color is a tone, not a hex value

`color` stores the name of one of the design system's tones: `pine`,
`ochre`, `ember`, `info`, `plum` or `slate`. The domain owns that list and
validates against it. The client resolves a tone name to the current
theme's tone variable, so a topic's color follows the light and dark themes
like every other tone in the interface.

A theme defines what each of these tones looks like, not which tones exist.
A future theme that recolors the palette changes every topic's color with
it, with no change to stored data. If a theme ever introduces a new tone,
it is added to the domain's list. A tone the client doesn't recognize
renders as `slate`, so a topic never loses its color entirely.

### Lifecycle

- **Create** with a name and a tone.
- **Rename or recolor** an existing topic. Its resources keep it.
- **Delete** removes the topic and unlinks it from the learner's resources.
  The resources themselves are kept. Before deleting, the interface shows
  how many resources use the topic and asks for confirmation.

`GET /topics` includes, for each topic, the number of the learner's
resources that use it. The confirmation reads that number instead of making
a separate request, and the same number can describe a topic anywhere else
it's listed.

### A learner's first topic is created while capturing

New accounts start with no topics. The topic selector used when capturing a
resource lets the learner type a name that doesn't exist yet and create the
topic on the spot. A topic created this way takes the next tone in a fixed
rotation through the list, based on how many topics the learner already
has, and can be recolored later. The capture flow's rule that a resource
needs at least one topic stays as it is.

### Existing topics move to their owner

No deployment exists yet, and the only data to carry over is a single
learner's. The migration that adds the owner column assigns each existing
topic to the owner of the resources that use it. Topics with the same name,
compared without regard to case, merge into one, and their resources move to
the topic that remains. A topic no resource uses is dropped. Each hex color
becomes the tone closest to it. The seed script creates topics for the user
it seeds instead of a shared list.

## Consequences

### Positive

- Topics follow the same ownership rule as everything else in the model,
  so no learner can change or reveal another learner's tags.
- Learners can shape their own vocabulary instead of living with a list
  they never chose.
- Topic colors follow the theme and stay within the design system's tones,
  and a theme that recolors the palette recolors every topic without
  touching stored data.

### Negative

- The same subject is now stored once per learner. Anything that later
  wants to compare topics across learners, such as a shared template of a
  learning path, has to match them by name.
- The migration merges duplicate topics and drops unused ones, and it can't
  be cleanly reverted once learners start creating topics of their own.
- Choosing from a fixed set of six tones offers fewer distinct colors per
  learner than a free hex value. Themes change what the six look like, not
  how many there are.

## Rejected Alternatives

- **Keep topics shared and add the lifecycle to them** — rejected. Any
  learner could rename or delete tags that other learners' resources depend
  on.
- **Read-only system topics plus each learner's own** — rejected. It keeps a
  shared list that learners can't edit, and leaves open what happens when a
  learner wants to rename or recolor one. Two kinds of topic would behave
  differently in every screen that lists them.
- **Store the tone's hex value** — rejected. It looks the same in both
  themes and stays fixed when a theme redefines the palette.
- **Copy a starter set of topics into every new account** — rejected. It
  hands learners tags they didn't choose and have to clean up. Creating a
  topic while capturing covers the empty account without that.

## References

- ADR-0013: Voice and file import (topic required on capture)
- ADR-0026: `CurrentUser` as an injected dependency (ownership scoping)
