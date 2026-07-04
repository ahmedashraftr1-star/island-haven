import type { SendEmailOptions } from "../lib/email";
import { sendEmail } from "../lib/email";
import { notify } from "../routes/notifications";
import { awardBadgeByKey } from "../routes/gamification";
import type { NotificationType } from "@workspace/db";
import { getQueue, queuesEnabled } from "./index";
import { logger } from "../lib/logger";

// Thin enqueue wrappers used at call sites in place of the direct fire-and-forget
// helpers. When queues are enabled the work is offloaded to the worker (retried,
// crash-durable); when they're off — or if the enqueue itself fails — the work
// runs inline exactly as before, so behaviour is preserved with no Redis.
//
// Call sites keep their fire-and-forget shape: `void queueEmail(...)`.

export interface NotifyPayload {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/** Send an email — via the queue when enabled, else inline. */
export async function queueEmail(opts: SendEmailOptions): Promise<void> {
  if (queuesEnabled()) {
    const q = getQueue("email");
    if (q) {
      try {
        await q.add("send", opts);
        return;
      } catch (err) {
        logger.error({ err }, "[queues] email enqueue failed — sending inline");
      }
    }
  }
  void sendEmail(opts);
}

/** Create an in-app notification — via the queue when enabled, else inline. */
export async function queueNotify(
  userId: number,
  n: NotifyPayload,
): Promise<void> {
  if (queuesEnabled()) {
    const q = getQueue("notifications");
    if (q) {
      try {
        await q.add("notify", { userId, n });
        return;
      } catch (err) {
        logger.error({ err }, "[queues] notify enqueue failed — running inline");
      }
    }
  }
  void notify(userId, n);
}

/** Award a badge by key — via the queue when enabled, else inline. */
export async function queueBadge(userId: number, key: string): Promise<void> {
  if (queuesEnabled()) {
    const q = getQueue("badges");
    if (q) {
      try {
        await q.add("award", { userId, key });
        return;
      } catch (err) {
        logger.error({ err }, "[queues] badge enqueue failed — running inline");
      }
    }
  }
  void awardBadgeByKey(userId, key);
}
