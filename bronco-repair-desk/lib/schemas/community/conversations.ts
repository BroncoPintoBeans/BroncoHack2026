import { z } from "zod";

export const createConversationSchema = z.object({
  offer_id: z.string().uuid().optional(),
  initial_message: z.string().min(1).max(2000).optional(),
});

export const listConversationsQuerySchema = z.object({
  type: z.enum(["case_helper"]).optional(),
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

export const getMessagesQuerySchema = z.object({
  limit: z.string().optional(),
  before: z.string().optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(2000),
  client_id: z.string().optional(),
});
