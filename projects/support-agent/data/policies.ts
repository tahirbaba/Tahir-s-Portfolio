import { STORE } from "./store";

export type PolicySection = { id: string; title: string; text: string };

export const POLICIES: PolicySection[] = [
  {
    id: "POL-1",
    title: "Refund window",
    text: `Delivered orders can be refunded for damaged, defective or not-as-described items within ${STORE.refundWindowDays} days of delivery. Requests after ${STORE.refundWindowDays} days are not eligible for a refund, but the customer may be offered a repair or replacement review by the care team.`,
  },
  {
    id: "POL-2",
    title: "Refund approval limits",
    text: `Support can approve refunds up to ${STORE.autoRefundLimit} USD per order immediately. Refunds above ${STORE.autoRefundLimit} USD are submitted for approval by a human care lead, who replies within one business day. The refund total can never exceed what the customer paid minus refunds already issued.`,
  },
  {
    id: "POL-3",
    title: "Late deliveries",
    text: `If an order is delivered more than ${STORE.lateDeliveryGraceDays} days after its estimated delivery date, the customer is entitled to a refund of the shipping fee. If shipping was free, offer a 10% store credit instead (handled by the care team).`,
  },
  {
    id: "POL-4",
    title: "Lost parcels",
    text: `A parcel with no carrier scan for ${STORE.lostAfterDaysWithoutScan} or more days is treated as lost. Lost orders receive a full refund of the order total, or a free replacement if the customer prefers.`,
  },
  {
    id: "POL-5",
    title: "Returns for change of mind",
    text: `Unused items in original packaging can be returned within ${STORE.refundWindowDays} days of delivery for a change of mind. A prepaid return label is issued and the refund is processed once the item arrives at the warehouse. Change-of-mind requests are not refunded before the return.`,
  },
  {
    id: "POL-6",
    title: "Address changes and cancellations",
    text: "The shipping address or the order can be changed or cancelled while the order is still processing. Once an order has shipped, the address cannot be changed by support; the customer can contact the carrier with the tracking number to request a redirect.",
  },
  {
    id: "POL-7",
    title: "Shipping times",
    text: "Standard delivery: UAE and Saudi Arabia 3-6 days, Pakistan 4-7 days, United Kingdom 5-8 days, United States 7-12 days. Large furniture can take up to 14 days.",
  },
  {
    id: "POL-8",
    title: "Identity and privacy",
    text: "Before sharing any order details or taking any action, support verifies the order number together with the email address used for the order. Never share details of an order that the customer has not verified, and never share other customers' information.",
  },
  {
    id: "POL-9",
    title: "Escalation to a human",
    text: "Hand the conversation to a human care agent when the customer mentions legal action, a chargeback, a safety issue or injury, harassment, or explicitly asks for a person, or when the request is outside these policies. Summarise the case so the customer does not have to repeat themselves.",
  },
  {
    id: "POL-10",
    title: "Payment methods and timing",
    text: "Refunds go back to the original payment method. Card refunds take 5-10 business days to appear; wallet refunds take 1-3 business days.",
  },
];
