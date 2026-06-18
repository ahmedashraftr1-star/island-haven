import { pgTable, serial, integer, timestamp, unique, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Directed follow edges between members. follower_id follows following_id.
// Powers follower/following counts, a personalized "following" feed, and
// new-work notifications to a member's followers.
export const userFollowsTable = pgTable(
  "user_follows",
  {
    id: serial("id").primaryKey(),
    followerId: integer("follower_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    followingId: integer("following_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniquePair: unique("user_follows_pair_unique").on(t.followerId, t.followingId),
    followerIdx: index("user_follows_follower_idx").on(t.followerId),
    followingIdx: index("user_follows_following_idx").on(t.followingId),
  }),
);

export type UserFollow = typeof userFollowsTable.$inferSelect;
