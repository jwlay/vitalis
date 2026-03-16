/**
 * PostgreSQL-backed storage implementation using pg Pool.
 * Used when DATABASE_URL is set in the environment.
 * Falls back to MemStorage when not configured.
 */
import { Pool } from "pg";
import type { IStorage } from "./storage";
import type {
  Profile, InsertProfile,
  BloodTest, InsertBloodTest,
  BiomarkerResult, InsertBiomarkerResult,
} from "@shared/schema";

export class PgStorage implements IStorage {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false });
  }

  async init(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date_of_birth TEXT NOT NULL,
        gender TEXT NOT NULL,
        ethnicity TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS blood_tests (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        test_date TEXT NOT NULL,
        lab_name TEXT,
        notes TEXT,
        raw_text TEXT,
        file_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS biomarker_results (
        id SERIAL PRIMARY KEY,
        blood_test_id INTEGER NOT NULL REFERENCES blood_tests(id) ON DELETE CASCADE,
        profile_id INTEGER NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        biomarker_key TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        original_value REAL,
        original_unit TEXT,
        test_date TEXT NOT NULL,
        flag_status TEXT
      );
    `);
  }

  // Profiles
  async getProfiles(): Promise<Profile[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM profiles ORDER BY created_at DESC"
    );
    return rows.map(this.mapProfile);
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    const { rows } = await this.pool.query("SELECT * FROM profiles WHERE id=$1", [id]);
    return rows[0] ? this.mapProfile(rows[0]) : undefined;
  }

  async createProfile(p: InsertProfile): Promise<Profile> {
    const { rows } = await this.pool.query(
      `INSERT INTO profiles (name, date_of_birth, gender, ethnicity, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [p.name, p.dateOfBirth, p.gender, p.ethnicity ?? null, p.notes ?? null]
    );
    return this.mapProfile(rows[0]);
  }

  async updateProfile(id: number, u: Partial<InsertProfile>): Promise<Profile | undefined> {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (u.name !== undefined) { sets.push(`name=$${i++}`); vals.push(u.name); }
    if (u.dateOfBirth !== undefined) { sets.push(`date_of_birth=$${i++}`); vals.push(u.dateOfBirth); }
    if (u.gender !== undefined) { sets.push(`gender=$${i++}`); vals.push(u.gender); }
    if (u.ethnicity !== undefined) { sets.push(`ethnicity=$${i++}`); vals.push(u.ethnicity); }
    if (u.notes !== undefined) { sets.push(`notes=$${i++}`); vals.push(u.notes); }
    if (sets.length === 0) return this.getProfile(id);
    vals.push(id);
    const { rows } = await this.pool.query(
      `UPDATE profiles SET ${sets.join(",")} WHERE id=$${i} RETURNING *`, vals
    );
    return rows[0] ? this.mapProfile(rows[0]) : undefined;
  }

  async deleteProfile(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query("DELETE FROM profiles WHERE id=$1", [id]);
    return (rowCount ?? 0) > 0;
  }

  // Blood Tests
  async getBloodTests(profileId: number): Promise<BloodTest[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM blood_tests WHERE profile_id=$1 ORDER BY test_date DESC", [profileId]
    );
    return rows.map(this.mapBloodTest);
  }

  async getBloodTest(id: number): Promise<BloodTest | undefined> {
    const { rows } = await this.pool.query("SELECT * FROM blood_tests WHERE id=$1", [id]);
    return rows[0] ? this.mapBloodTest(rows[0]) : undefined;
  }

  async createBloodTest(t: InsertBloodTest): Promise<BloodTest> {
    const { rows } = await this.pool.query(
      `INSERT INTO blood_tests (profile_id, test_date, lab_name, notes, raw_text, file_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [t.profileId, t.testDate, t.labName ?? null, t.notes ?? null, t.rawText ?? null, t.fileName ?? null]
    );
    return this.mapBloodTest(rows[0]);
  }

  async updateBloodTest(id: number, u: Partial<InsertBloodTest>): Promise<BloodTest | undefined> {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (u.testDate !== undefined) { sets.push(`test_date=$${i++}`); vals.push(u.testDate); }
    if (u.labName !== undefined) { sets.push(`lab_name=$${i++}`); vals.push(u.labName); }
    if (u.notes !== undefined) { sets.push(`notes=$${i++}`); vals.push(u.notes); }
    if (sets.length === 0) return this.getBloodTest(id);
    vals.push(id);
    const { rows } = await this.pool.query(
      `UPDATE blood_tests SET ${sets.join(",")} WHERE id=$${i} RETURNING *`, vals
    );
    return rows[0] ? this.mapBloodTest(rows[0]) : undefined;
  }

  async deleteBloodTest(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query("DELETE FROM blood_tests WHERE id=$1", [id]);
    return (rowCount ?? 0) > 0;
  }

  // Biomarker Results
  async getBiomarkerResults(profileId: number): Promise<BiomarkerResult[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM biomarker_results WHERE profile_id=$1 ORDER BY test_date DESC", [profileId]
    );
    return rows.map(this.mapBiomarkerResult);
  }

  async getBiomarkerResultsByTest(bloodTestId: number): Promise<BiomarkerResult[]> {
    const { rows } = await this.pool.query(
      "SELECT * FROM biomarker_results WHERE blood_test_id=$1 ORDER BY biomarker_key", [bloodTestId]
    );
    return rows.map(this.mapBiomarkerResult);
  }

  async createBiomarkerResult(r: InsertBiomarkerResult): Promise<BiomarkerResult> {
    const { rows } = await this.pool.query(
      `INSERT INTO biomarker_results (blood_test_id, profile_id, biomarker_key, value, unit, original_value, original_unit, test_date, flag_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [r.bloodTestId, r.profileId, r.biomarkerKey, r.value, r.unit, r.originalValue ?? null, r.originalUnit ?? null, r.testDate, r.flagStatus ?? null]
    );
    return this.mapBiomarkerResult(rows[0]);
  }

  async createBiomarkerResults(results: InsertBiomarkerResult[]): Promise<BiomarkerResult[]> {
    if (results.length === 0) return [];
    return Promise.all(results.map(r => this.createBiomarkerResult(r)));
  }

  async updateBiomarkerResult(id: number, updates: { value?: number; unit?: string; flagStatus?: string | null }): Promise<BiomarkerResult | undefined> {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (updates.value !== undefined) { sets.push(`value=$${i++}`); vals.push(updates.value); }
    if (updates.unit !== undefined) { sets.push(`unit=$${i++}`); vals.push(updates.unit); }
    if (updates.flagStatus !== undefined) { sets.push(`flag_status=$${i++}`); vals.push(updates.flagStatus); }
    if (sets.length === 0) return undefined;
    vals.push(id);
    const { rows } = await this.pool.query(
      `UPDATE biomarker_results SET ${sets.join(",")} WHERE id=$${i} RETURNING *`, vals
    );
    return rows[0] ? this.mapBiomarkerResult(rows[0]) : undefined;
  }

  async deleteBiomarkerResult(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query("DELETE FROM biomarker_results WHERE id=$1", [id]);
    return (rowCount ?? 0) > 0;
  }

  async deleteBiomarkerResultsByTest(bloodTestId: number): Promise<boolean> {
    await this.pool.query("DELETE FROM biomarker_results WHERE blood_test_id=$1", [bloodTestId]);
    return true;
  }

  // Mappers (snake_case → camelCase)
  private mapProfile(row: any): Profile {
    return {
      id: row.id,
      name: row.name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      ethnicity: row.ethnicity ?? null,
      notes: row.notes ?? null,
      createdAt: row.created_at,
    };
  }

  private mapBloodTest(row: any): BloodTest {
    return {
      id: row.id,
      profileId: row.profile_id,
      testDate: row.test_date,
      labName: row.lab_name ?? null,
      notes: row.notes ?? null,
      rawText: row.raw_text ?? null,
      fileName: row.file_name ?? null,
      createdAt: row.created_at,
    };
  }

  private mapBiomarkerResult(row: any): BiomarkerResult {
    return {
      id: row.id,
      bloodTestId: row.blood_test_id,
      profileId: row.profile_id,
      biomarkerKey: row.biomarker_key,
      value: row.value,
      unit: row.unit,
      originalValue: row.original_value ?? null,
      originalUnit: row.original_unit ?? null,
      testDate: row.test_date,
      flagStatus: row.flag_status ?? null,
    };
  }
}
