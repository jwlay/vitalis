import { pgTable, text, integer, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Profiles — each user can have multiple health profiles
export const profiles = pgTable("profiles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(), // ISO date string
  gender: text("gender").notNull(), // 'male' | 'female' | 'other'
  ethnicity: text("ethnicity"),
  notes: text("notes"),
  // JSON object mapping biomarkerKey -> referenceSetId, e.g. { "glucose": "longevity", "ldl_cholesterol": "clinical" }
  referencePreferences: text("reference_preferences"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true });
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// Blood tests — one per uploaded PDF
export const bloodTests = pgTable("blood_tests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  profileId: integer("profile_id").notNull(),
  testDate: text("test_date").notNull(), // ISO date string
  labName: text("lab_name"),
  notes: text("notes"),
  rawText: text("raw_text"), // extracted PDF text
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBloodTestSchema = createInsertSchema(bloodTests).omit({ id: true, createdAt: true });
export type InsertBloodTest = z.infer<typeof insertBloodTestSchema>;
export type BloodTest = typeof bloodTests.$inferSelect;

// Biomarker results — each individual measurement from a test
export const biomarkerResults = pgTable("biomarker_results", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  bloodTestId: integer("blood_test_id").notNull(),
  profileId: integer("profile_id").notNull(),
  biomarkerKey: text("biomarker_key").notNull(), // e.g. "glucose", "hdl_cholesterol"
  value: real("value").notNull(),
  unit: text("unit").notNull(), // normalized unit
  originalValue: real("original_value"),
  originalUnit: text("original_unit"),
  testDate: text("test_date").notNull(),
  flagStatus: text("flag_status"), // 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high'
});

export const insertBiomarkerResultSchema = createInsertSchema(biomarkerResults).omit({ id: true });
export type InsertBiomarkerResult = z.infer<typeof insertBiomarkerResultSchema>;
export type BiomarkerResult = typeof biomarkerResults.$inferSelect;
