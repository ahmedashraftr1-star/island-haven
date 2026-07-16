// Black-box integration tests for the blog API (public list/detail + admin CRUD).
// Runs against a LIVE server (default http://localhost:3001) with an admin account.
// Self-contained: every post it creates is deleted in the after() hook.
//
//   pnpm test          (server must be running: pnpm run dev:local)
//
// Env: API_BASE, TEST_ADMIN_USER, TEST_ADMIN_PASS.

import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.API_BASE ?? "http://localhost:3001/api";
const ADMIN_USER = process.env.TEST_ADMIN_USER ?? "ahmedashraf";
const ADMIN_PASS = process.env.TEST_ADMIN_PASS ?? "ahmedadmin$$";

let adminToken = "";
const createdIds = [];

async function req(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json };
}

// A valid create body; `tag` keeps titles/content unique per run so slug dedup and
// visibility assertions never collide with earlier data.
function mkPost(tag, overrides = {}) {
  return {
    category: "tech",
    status: "draft",
    title: `عنوان تجريبي ${tag}`,
    titleEn: `Test Post ${tag}`,
    excerpt: "مقتطف",
    excerptEn: "Excerpt",
    body: `محتوى المقالة التجريبيّة رقم ${tag} — نصّ كافٍ الطول.`,
    bodyEn: `Body of the test article ${tag} — long enough to pass validation.`,
    author: "فريق آيلاند",
    authorEn: "Island Team",
    ...overrides,
  };
}

before(async () => {
  const r = await req("/admin/login", {
    method: "POST",
    body: { username: ADMIN_USER, password: ADMIN_PASS },
  });
  assert.equal(r.status, 200, "admin login should succeed — is the server running & seeded?");
  adminToken = r.json.token;
  assert.ok(adminToken, "admin login returns a token");
});

after(async () => {
  // Best-effort cleanup so the suite is repeatable and leaves no residue.
  for (const id of createdIds) {
    await req(`/admin/blog/${id}`, { method: "DELETE", token: adminToken });
  }
});

describe("blog — admin authorization gating", () => {
  test("anon cannot list the admin blog", async () => {
    const r = await req("/admin/blog");
    assert.equal(r.status, 401);
  });
  test("anon cannot create a post", async () => {
    const r = await req("/admin/blog", { method: "POST", body: mkPost("anon") });
    assert.equal(r.status, 401);
  });
  test("anon cannot patch a post", async () => {
    const r = await req("/admin/blog/1", { method: "PATCH", body: { status: "published" } });
    assert.equal(r.status, 401);
  });
  test("anon cannot delete a post", async () => {
    const r = await req("/admin/blog/1", { method: "DELETE" });
    assert.equal(r.status, 401);
  });
});

describe("blog — validation", () => {
  test("rejects a too-short title with field details", async () => {
    const r = await req("/admin/blog", {
      method: "POST",
      token: adminToken,
      body: mkPost("v", { title: "x", titleEn: "y" }),
    });
    assert.equal(r.status, 400);
    assert.ok(Array.isArray(r.json.details) && r.json.details.length > 0, "returns field-level details");
  });
  test("rejects an invalid category", async () => {
    const r = await req("/admin/blog", {
      method: "POST",
      token: adminToken,
      body: mkPost("v2", { category: "not-a-category" }),
    });
    assert.equal(r.status, 400);
  });
});

describe("blog — draft lifecycle & public visibility", () => {
  let draftId = 0;
  let draftSlug = "";

  test("create → draft has a slug and no publishedAt", async () => {
    const tag = `d-${Date.now()}`;
    const r = await req("/admin/blog", { method: "POST", token: adminToken, body: mkPost(tag) });
    assert.equal(r.status, 200);
    assert.ok(r.json.post?.id, "returns the created post");
    draftId = r.json.post.id;
    draftSlug = r.json.post.slug;
    createdIds.push(draftId);
    assert.ok(draftSlug, "a slug was generated");
    assert.equal(r.json.post.status, "draft");
    assert.equal(r.json.post.publishedAt, null, "a draft has no publishedAt");
  });

  test("a draft is hidden from the public list", async () => {
    const r = await req("/blog?limit=100");
    assert.equal(r.status, 200);
    const ids = (r.json.posts ?? []).map((p) => p.id);
    assert.ok(!ids.includes(draftId), "draft must not appear in GET /blog");
  });

  test("a draft's slug 404s on the public detail", async () => {
    const r = await req(`/blog/${encodeURIComponent(draftSlug)}`);
    assert.equal(r.status, 404);
  });

  test("publish → stamps publishedAt and reveals it publicly", async () => {
    const patch = await req(`/admin/blog/${draftId}`, {
      method: "PATCH",
      token: adminToken,
      body: { status: "published" },
    });
    assert.equal(patch.status, 200);
    assert.equal(patch.json.post.status, "published");
    assert.ok(patch.json.post.publishedAt, "publishing stamps publishedAt");

    const detail = await req(`/blog/${encodeURIComponent(draftSlug)}`);
    assert.equal(detail.status, 200, "published post is reachable by slug");
    assert.equal(detail.json.post.id, draftId);

    const list = await req("/blog?limit=100");
    const ids = (list.json.posts ?? []).map((p) => p.id);
    assert.ok(ids.includes(draftId), "published post appears in GET /blog");
  });

  test("category filter includes the post under its category, excludes it under another", async () => {
    const inTech = await req("/blog?category=tech&limit=100");
    assert.ok((inTech.json.posts ?? []).map((p) => p.id).includes(draftId), "listed under tech");
    const inFunding = await req("/blog?category=funding&limit=100");
    assert.ok(!(inFunding.json.posts ?? []).map((p) => p.id).includes(draftId), "not listed under funding");
  });
});

describe("blog — slugs & detail edge cases", () => {
  test("a non-existent slug 404s", async () => {
    const r = await req(`/blog/definitely-not-a-real-slug-${Date.now()}`);
    assert.equal(r.status, 404);
  });

  test("two posts with the same title get distinct slugs", async () => {
    const title = { title: `عنوان مكرّر ${Date.now()}`, titleEn: `Duplicate Title ${Date.now()}` };
    const a = await req("/admin/blog", { method: "POST", token: adminToken, body: mkPost("dup-a", title) });
    const b = await req("/admin/blog", { method: "POST", token: adminToken, body: mkPost("dup-b", title) });
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    createdIds.push(a.json.post.id, b.json.post.id);
    assert.notEqual(a.json.post.slug, b.json.post.slug, "collision must de-duplicate the slug");
  });
});

describe("blog — delete", () => {
  test("delete removes the post and its public detail", async () => {
    const tag = `del-${Date.now()}`;
    const created = await req("/admin/blog", {
      method: "POST",
      token: adminToken,
      body: mkPost(tag, { status: "published" }),
    });
    assert.equal(created.status, 200);
    const { id, slug } = created.json.post;

    const before = await req(`/blog/${encodeURIComponent(slug)}`);
    assert.equal(before.status, 200, "published before delete");

    const del = await req(`/admin/blog/${id}`, { method: "DELETE", token: adminToken });
    assert.equal(del.status, 200);
    assert.equal(del.json.ok, true);

    const after = await req(`/blog/${encodeURIComponent(slug)}`);
    assert.equal(after.status, 404, "gone after delete");
  });

  test("delete with a non-numeric id → 404", async () => {
    const r = await req("/admin/blog/not-an-id", { method: "DELETE", token: adminToken });
    assert.equal(r.status, 404);
  });
});
