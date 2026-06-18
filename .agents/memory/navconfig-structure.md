---
name: navConfig structure
description: Web app navigation structure — which routes appear in main bar vs secondary
---

Main bar (NAV_ITEMS): home, programs, cohorts, ventures, opportunities, experts, resources, team, about.
Secondary (NAV_SECONDARY): perks, learning, messages, leaderboard, notification-settings, stories, jobs, courses, members, events, gallery, numbers, press, search.

**Why:** GitHub's version groups incubator-core pages (cohorts, opportunities, resources, team) in the main nav. stories/jobs/investors moved to secondary. messages/learning/notifications added to secondary.

**How to apply:** When adding a new destination, place it in secondary unless it is a top-level incubator concept. Never add more than 9 items to NAV_ITEMS (overflow breaks the top bar layout).

Mobile equivalent: leaderboard/perks/messages screens exist as standalone routes accessible from the profile tab's quick-access card.
