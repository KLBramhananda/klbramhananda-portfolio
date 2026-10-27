/**
 * The Contact form's fields, validation rules and the B-Bot chat script.
 *
 * State diagram of the chat (a visitor answer that fails validation repeats
 * the same step; Edit jumps back to a chosen field and returns to review):
 *
 *   name ─▶ email ─▶ subject ─▶ message ─▶ review ─▶ sending ─▶ done
 *                                            │  ▲                 │ (cooldown over)
 *                                       Edit ▼  │ answered        ▼
 *                                         edit-<field>          name  ("Send another")
 *                                                       sending ─▶ error ─▶ sending ("Try again")
 */

export const FIELDS = ["name", "email", "subject", "message"] as const;
export type FieldName = (typeof FIELDS)[number];
export type Values = Record<FieldName, string>;
export type Errors = Partial<Record<FieldName, string>>;

export const EMPTY: Values = { name: "", email: "", subject: "", message: "" };
export const MESSAGE_MAX = 2000;

/** The validation rules, on trimmed input (unchanged from the classic form). */
export function validate(v: Values): Errors {
  const e: Errors = {};
  const name = v.name.trim();
  const email = v.email.trim();
  const subject = v.subject.trim();
  const message = v.message.trim();
  if (!name) e.name = "Please enter your name.";
  else if (name.length < 2) e.name = "Name must be at least 2 characters.";
  else if (name.length > 80) e.name = "Name must be 80 characters or fewer.";
  if (!email) e.email = "Please enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address.";
  if (!subject) e.subject = "Please enter a subject.";
  else if (subject.length < 3) e.subject = "Subject must be at least 3 characters.";
  else if (subject.length > 120) e.subject = "Subject must be 120 characters or fewer.";
  if (!message) e.message = "Please write a message.";
  else if (message.length < 20) e.message = `Message must be at least 20 characters (${message.length}/20).`;
  else if (message.length > MESSAGE_MAX) e.message = `Message must be ${MESSAGE_MAX} characters or fewer.`;
  return e;
}

/** The rule check for one field. */
export function fieldError(field: FieldName, value: string): string | undefined {
  return validate({ ...EMPTY, [field]: value })[field];
}

/** The first field whose value fails its rule, or "review" when all are fine. */
export function stepFor(values: Values): FieldName | "review" {
  return FIELDS.find((f) => fieldError(f, values[f])) ?? "review";
}

export type Step = FieldName | "review" | "sending" | "done" | "error";

export const NEXT: Record<FieldName, FieldName | "review"> = {
  name: "email",
  email: "subject",
  subject: "message",
  message: "review",
};

export const SUBJECT_CHIPS = ["Job opportunity", "Project collaboration", "Freelance", "Just saying hi"];

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** What B-Bot says when a field's turn comes. */
export function prompt(field: FieldName, name: string): string {
  switch (field) {
    case "name":
      return "Hey! I'm B-Bot, Bramha's assistant. What's your name?";
    case "email":
      return `Nice to meet you, ${firstName(name)}. What's your email?`;
    case "subject":
      return "What's it about?";
    case "message":
      return "Tell me more — what would you like to discuss?";
  }
}

/** The visible label of the input: the current question. */
export const QUESTION: Record<FieldName, string> = {
  name: "What's your name?",
  email: "What's your email?",
  subject: "What's it about?",
  message: "What would you like to discuss?",
};

/** A friendly version of the rule's error, for the chat. */
export function friendlyError(field: FieldName, value: string): string {
  const err = fieldError(field, value) ?? "";
  const n = value.trim().length;
  switch (field) {
    case "name":
      return n > 80 ? "That's a long name — could you keep it under 80 characters?" : "Hmm, I need at least 2 characters for your name — try again?";
    case "email":
      return "Hmm, that email doesn't look right — try again?";
    case "subject":
      return n > 120 ? "Could you shorten that to 120 characters or fewer?" : "Could you give me a subject of at least 3 characters?";
    case "message":
      return n > MESSAGE_MAX
        ? `That's over ${MESSAGE_MAX} characters — could you trim it a little?`
        : `A bit more, please — I need at least 20 characters to work with (you're at ${n}).`;
  }
  return err;
}

export const SENT_TEXT = "Sent! Bramha usually replies within 24 h. 🚀";
export const ERROR_TEXT = "Something went wrong on my side.";
export const REVIEW_TEXT = "Here's what I'll send:";
