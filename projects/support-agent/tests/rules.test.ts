import { test } from "node:test";
import assert from "node:assert/strict";
import { executeTool, emptyState, searchPolicy, type SessionState } from "../lib/tools";
import { redactText } from "../lib/pii";

const verify = (id: string, email: string, s: SessionState = emptyState()) => executeTool("verify_order", { order_id: id, email }, s);
const as = (id: string, email: string) => verify(id, email).state;

test("identity: correct order + email verifies", () => {
  const r = verify("NH-1001", "aisha.k@example.com");
  assert.equal(r.isError, false);
  assert.deepEqual(r.state.verified, ["NH-1001"]);
});
test("identity: wrong email is rejected without leaking order details", () => {
  const r = verify("NH-1001", "someone@example.com");
  assert.equal(r.isError, true);
  assert.equal("order" in r.result, false);
});
test("identity: unknown order gives the same error as a wrong email", () => {
  assert.equal(verify("NH-9999", "x@example.com").result.error, verify("NH-1001", "x@example.com").result.error);
});
test("identity: order number formats are normalised (#nh1001, nh-1001)", () => {
  assert.equal(verify("#nh1001", "AISHA.K@example.com").isError, false);
});
test("identity: locks after three failed attempts", () => {
  let s = emptyState();
  for (let i = 0; i < 3; i++) s = verify("NH-1001", "bad@example.com", s).state;
  assert.equal(verify("NH-1001", "aisha.k@example.com", s).isError, true);
});
test("actions require verification first", () => {
  const r = executeTool("issue_refund", { order_id: "NH-1001", amount: 20, reason: "damaged" }, emptyState());
  assert.equal(r.isError, true);
  assert.equal(r.state.actions.length, 0);
});
test("refund: verifying one order does not unlock another", () => {
  const r = executeTool("issue_refund", { order_id: "NH-1002", amount: 20, reason: "damaged" }, as("NH-1001", "aisha.k@example.com"));
  assert.equal(r.isError, true);
});
test("refund: damaged item within window and under limit is issued", () => {
  const r = executeTool("issue_refund", { order_id: "NH-1001", amount: 64, reason: "damaged" }, as("NH-1001", "aisha.k@example.com"));
  assert.equal(r.result.status, "refunded");
});
test("refund: above 100 USD goes to human approval, not issued", () => {
  const r = executeTool("issue_refund", { order_id: "NH-1002", amount: 289, reason: "damaged" }, as("NH-1002", "omar.f@example.com"));
  assert.equal(r.result.status, "pending_approval");
  assert.equal(r.state.actions[0].status, "pending_approval");
});
test("refund: outside 30-day window is refused", () => {
  const r = executeTool("issue_refund", { order_id: "NH-1006", amount: 64, reason: "damaged" }, as("NH-1006", "bilal.h@example.com"));
  assert.equal(r.isError, true);
  assert.match(String(r.result.error), /window/);
});
test("refund: cannot exceed remaining refundable amount (prior refunds counted)", () => {
  const r = executeTool("issue_refund", { order_id: "NH-1017", amount: 80, reason: "damaged" }, as("NH-1017", "imran.s@example.com"));
  assert.equal(r.isError, true);
});
test("refund: duplicate refund for the same reason is blocked", () => {
  const s1 = executeTool("issue_refund", { order_id: "NH-1001", amount: 30, reason: "damaged" }, as("NH-1001", "aisha.k@example.com")).state;
  assert.equal(executeTool("issue_refund", { order_id: "NH-1001", amount: 30, reason: "damaged" }, s1).isError, true);
});
test("late delivery: shipping fee refunded when late by more than 5 days", () => {
  const r = executeTool("issue_refund", { order_id: "NH-1004", amount: 25, reason: "late_delivery" }, as("NH-1004", "james.r@example.com"));
  assert.equal(r.result.status, "refunded");
});
test("late delivery: amount above the shipping fee is refused", () => {
  const r = executeTool("issue_refund", { order_id: "NH-1004", amount: 100, reason: "late_delivery" }, as("NH-1004", "james.r@example.com"));
  assert.equal(r.isError, true);
});
test("late delivery: on-time order is refused", () => {
  const r = executeTool("issue_refund", { order_id: "NH-1001", amount: 8, reason: "late_delivery" }, as("NH-1001", "aisha.k@example.com"));
  assert.equal(r.isError, true);
});
test("lost parcel: full refund allowed only when status is lost", () => {
  assert.equal(executeTool("issue_refund", { order_id: "NH-1013", amount: 85, reason: "lost" }, as("NH-1013", "yusuf.b@example.com")).result.status, "refunded");
  assert.equal(executeTool("issue_refund", { order_id: "NH-1010", amount: 118, reason: "lost" }, as("NH-1010", "layla.n@example.com")).isError, true);
});
test("lost parcel above 100 USD needs approval", () => {
  assert.equal(executeTool("issue_refund", { order_id: "NH-1014", amount: 165, reason: "lost" }, as("NH-1014", "grace.l@example.com")).result.status, "pending_approval");
});
test("cancelled order cannot be refunded again", () => {
  assert.equal(executeTool("issue_refund", { order_id: "NH-1018", amount: 10, reason: "damaged" }, as("NH-1018", "sara.o@example.com")).isError, true);
});
test("address change allowed while processing, refused once shipped", () => {
  assert.equal(executeTool("update_address", { order_id: "NH-1008", new_address: "House 22, DHA Phase 6, Lahore" }, as("NH-1008", "hamza.a@example.com")).isError, false);
  assert.equal(executeTool("update_address", { order_id: "NH-1010", new_address: "Villa 9, Jumeirah 3, Dubai" }, as("NH-1010", "layla.n@example.com")).isError, true);
});
test("cancel only while processing; refunds the full amount", () => {
  const r = executeTool("cancel_order", { order_id: "NH-1009", }, as("NH-1009", "noura.s@example.com"));
  assert.equal(r.result.refunded, 90);
  assert.equal(executeTool("cancel_order", { order_id: "NH-1011" }, as("NH-1011", "daniel.p@example.com")).isError, true);
});
test("returns: within window ok, outside refused", () => {
  assert.equal(executeTool("start_return", { order_id: "NH-1003" }, as("NH-1003", "sana.m@example.com")).isError, false);
  assert.equal(executeTool("start_return", { order_id: "NH-1007" }, as("NH-1007", "emily.c@example.com")).isError, true);
});
test("escalation never attaches an unverified order", () => {
  const r = executeTool("escalate_to_human", { reason: "legal", priority: "high", summary: "x", order_id: "NH-1002" }, emptyState());
  assert.equal(r.state.actions[0].orderId, undefined);
});
test("policy search finds the right section", () => {
  assert.equal(searchPolicy("refund approval limit")[0].id, "POL-2");
  assert.equal(searchPolicy("lost parcel")[0].id, "POL-4");
  assert.equal(searchPolicy("change shipping address")[0].id, "POL-6");
});
test("PII redaction masks emails, phones and cards but keeps dates", () => {
  const s = redactText("aisha.k@example.com +971 50 123 4567 4111 1111 1111 1111 on 2026-10-15");
  assert.ok(!s.includes("aisha.k@"));
  assert.ok(!s.includes("4111"));
  assert.ok(!s.includes("123 4567"));
  assert.ok(s.includes("2026-10-15"));
});
