import Message, { conversationIdFor } from "../models/Message.js";
import User from "../models/User.js";
import Job from "../models/Job.js";

/**
 * POST /api/messages
 * Start or continue a conversation with another user.
 * Body: { toUserId, text, jobId? }
 *
 * The two participants must be one candidate + one employer (the app never lets
 * candidates message candidates, etc.). We derive candidate/employer from roles.
 */
export async function sendMessage(req, res) {
  try {
    const { toUserId, text, jobId } = req.body || {};
    const body = (text || "").trim();
    if (!toUserId) return res.status(400).json({ message: "Recipient is required" });
    if (!body) return res.status(400).json({ message: "Message cannot be empty" });
    if (String(toUserId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    const other = await User.findById(toUserId).select("role name");
    if (!other) return res.status(404).json({ message: "User not found" });

    // Must be exactly one candidate + one employer.
    if (req.user.role === other.role) {
      return res.status(400).json({ message: "You can only message the other side" });
    }
    const candidateId = req.user.role === "candidate" ? req.user._id : other._id;
    const employerId = req.user.role === "employer" ? req.user._id : other._id;

    // If a jobId is given, keep it only when it actually belongs to this employer.
    let job = undefined;
    if (jobId) {
      const j = await Job.findById(jobId).select("postedBy");
      if (j && String(j.postedBy) === String(employerId)) job = j._id;
    }

    const msg = await Message.create({
      conversationId: conversationIdFor(candidateId, employerId),
      candidate: candidateId,
      employer: employerId,
      sender: req.user._id,
      job,
      text: body,
    });

    res.status(201).json({ message: msg });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * GET /api/messages/conversations
 * The current user's inbox: one row per conversation with the last message,
 * the other participant's basic info, and an unread count.
 */
export async function myConversations(req, res) {
  try {
    const me = String(req.user._id);
    const mine = req.user.role === "candidate" ? { candidate: req.user._id } : { employer: req.user._id };

    // Newest first so the first message we see per conversation is the latest.
    const all = await Message.find(mine)
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    // Collapse to one entry per conversationId.
    const byConv = new Map();
    for (const m of all) {
      let row = byConv.get(m.conversationId);
      if (!row) {
        row = {
          conversationId: m.conversationId,
          otherUserId: String(m.candidate) === me ? String(m.employer) : String(m.candidate),
          lastMessage: m.text,
          lastAt: m.createdAt,
          lastSender: String(m.sender),
          job: m.job ? String(m.job) : null,
          unread: 0,
        };
        byConv.set(m.conversationId, row);
      }
      // Unread = messages sent by the OTHER person that I haven't read.
      if (String(m.sender) !== me && !m.readAt) row.unread += 1;
    }

    const rows = [...byConv.values()];

    // Hydrate the other participant + optional job title in bulk.
    const userIds = [...new Set(rows.map((r) => r.otherUserId))];
    const jobIds = [...new Set(rows.map((r) => r.job).filter(Boolean))];
    const [users, jobs] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select("name role headline companyName photoUrl").lean(),
      Job.find({ _id: { $in: jobIds } }).select("title").lean(),
    ]);
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const jobMap = new Map(jobs.map((j) => [String(j._id), j]));

    const conversations = rows.map((r) => {
      const u = userMap.get(r.otherUserId) || {};
      return {
        conversationId: r.conversationId,
        otherUser: {
          _id: r.otherUserId,
          name: u.companyName || u.name || "User",
          role: u.role,
          headline: u.headline,
          photoUrl: u.photoUrl,
        },
        jobTitle: r.job ? jobMap.get(r.job)?.title || null : null,
        lastMessage: r.lastMessage,
        lastAt: r.lastAt,
        sentByMe: r.lastSender === me,
        unread: r.unread,
      };
    });

    // Already roughly newest-first from the query, but re-sort to be safe.
    conversations.sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/messages/with/:userId
 * Full thread between the current user and :userId. Also marks the other
 * person's messages as read (so unread badges clear when you open the chat).
 */
export async function conversationWith(req, res) {
  try {
    const me = req.user._id;
    const otherId = req.params.userId;

    const other = await User.findById(otherId).select("name role headline companyName photoUrl");
    if (!other) return res.status(404).json({ message: "User not found" });

    const conversationId = conversationIdFor(me, otherId);

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();

    // Mark unread messages FROM the other person as read.
    await Message.updateMany(
      { conversationId, sender: otherId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    res.json({
      otherUser: {
        _id: String(other._id),
        name: other.companyName || other.name || "User",
        role: other.role,
        headline: other.headline,
        photoUrl: other.photoUrl,
      },
      messages: messages.map((m) => ({
        _id: String(m._id),
        text: m.text,
        sentByMe: String(m.sender) === String(me),
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/messages/unread-count
 * Total unread messages across all conversations (for a tab badge).
 */
export async function unreadCount(req, res) {
  try {
    const mine = req.user.role === "candidate" ? { candidate: req.user._id } : { employer: req.user._id };
    const count = await Message.countDocuments({
      ...mine,
      sender: { $ne: req.user._id },
      readAt: null,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
