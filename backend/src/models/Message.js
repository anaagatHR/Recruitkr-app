import mongoose from "mongoose";

/**
 * A single 1-on-1 message between a candidate and an employer.
 *
 * A "conversation" is not its own collection — it's simply all messages that
 * share the same (candidate, employer) pair. We build a stable `conversationId`
 * from the two user ids (sorted) so both sides map to the same thread, and
 * optionally tie the thread to the job it started from for context.
 */
const messageSchema = new mongoose.Schema(
  {
    // Stable id for the thread: "<smallerUserId>_<largerUserId>".
    conversationId: { type: String, required: true, index: true },

    // The two participants (always one candidate + one employer).
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    employer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Who actually wrote this message.
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Optional job this conversation is about (for a header/context line).
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },

    text: { type: String, required: true, trim: true, maxlength: 2000 },

    // Has the OTHER participant read it yet?
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Fast "give me this thread, newest last" and unread counts.
messageSchema.index({ conversationId: 1, createdAt: 1 });

/** Build the deterministic conversation id for two user ids. */
export function conversationIdFor(a, b) {
  const [x, y] = [String(a), String(b)].sort();
  return `${x}_${y}`;
}

export default mongoose.model("Message", messageSchema);
