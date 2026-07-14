/**
 * One place that decides how a person is credited, so the homepage section and the
 * /stories page can never again disagree about it.
 *
 * The venture is only worth stating if the reader hasn't just been told it — and in
 * this data they usually have, in one of two places. The role often names it
 * ("مؤسِّسة ومديرة تنفيذيّة — مستشارك"), and so does the person field when the
 * "person" is a team ("فريق مستشارك"). Concatenating regardless produced
 * "مؤسِّسة ومديرة تنفيذيّة — مستشارك · مستشارك" and "فريق مستشارك · … · مستشارك":
 * the venture said twice, inches apart. That is what makes attributions look
 * careless, and it is the bug the owner kept seeing.
 *
 * So: name the venture only when neither the name nor the role already carries it.
 */
export function credit(name: string, role: string, venture: string): string {
  const n = (name ?? "").trim();
  const r = (role ?? "").trim();
  const v = (venture ?? "").trim();
  if (!v || n.includes(v) || r.includes(v)) return r;
  return [r, v].filter(Boolean).join(" · ");
}
