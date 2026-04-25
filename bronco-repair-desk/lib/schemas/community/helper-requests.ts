import { z } from "zod";

export const createHelperRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  public_summary: z.string().min(1).max(2000).optional(),
  campus_area: z.string().max(100).optional(),
  preferred_time: z.string().max(200).optional(),
  skill_tags: z.array(z.string().max(50)).max(10).optional(),
  expires_at: z.string().datetime().optional(),
});

export const listHelperRequestsQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  urgency: z.string().optional(),
  campus_area: z.string().optional(),
  skill: z.string().optional(),
  q: z.string().optional(),
  mine: z.enum(["owner", "helper"]).optional(),
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

export const updateHelperRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  public_summary: z.string().min(1).max(2000).optional(),
  campus_area: z.string().max(100).nullable().optional(),
  preferred_time: z.string().max(200).nullable().optional(),
  skill_tags: z.array(z.string().max(50)).max(10).optional(),
  status: z
    .enum([
      "open",
      "in_progress",
      "resolved",
      "cancelled",
      "expired",
      "no_helper_found",
    ])
    .optional(),
});

export const createOfferSchema = z.object({
  offer_message: z.string().min(1).max(2000),
  availability: z.string().max(200).optional(),
  skill_tags: z.array(z.string().max(50)).max(10).optional(),
  technician_profile_id: z.string().uuid().optional(),
});

export const updateOfferSchema = z.object({
  action: z.enum(["accept", "decline", "withdraw"]),
});
