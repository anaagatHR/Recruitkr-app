import { Router } from "express";
import {
  sendMessage,
  myConversations,
  conversationWith,
  unreadCount,
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All messaging routes require a logged-in user (candidate or employer).
router.use(protect);

router.get("/conversations", myConversations);
router.get("/unread-count", unreadCount);
router.get("/with/:userId", conversationWith);
router.post("/", sendMessage);

export default router;
