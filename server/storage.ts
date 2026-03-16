import { profiles, bloodTests, biomarkerResults, type Profile, type InsertProfile, type BloodTest, type InsertBloodTest, type BiomarkerResult, type InsertBiomarkerResult } from "@shared/schema";

export interface IStorage {
  // Profiles
  getProfiles(): Promise<Profile[]>;
  getProfile(id: number): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(id: number, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  deleteProfile(id: number): Promise<boolean>;

  // Blood Tests
  getBloodTests(profileId: number): Promise<BloodTest[]>;
  getBloodTest(id: number): Promise<BloodTest | undefined>;
  createBloodTest(test: InsertBloodTest): Promise<BloodTest>;
  updateBloodTest(id: number, updates: Partial<InsertBloodTest>): Promise<BloodTest | undefined>;
  deleteBloodTest(id: number): Promise<boolean>;

  // Biomarker Results
  getBiomarkerResults(profileId: number): Promise<BiomarkerResult[]>;
  getBiomarkerResultsByTest(bloodTestId: number): Promise<BiomarkerResult[]>;
  createBiomarkerResult(result: InsertBiomarkerResult): Promise<BiomarkerResult>;
  createBiomarkerResults(results: InsertBiomarkerResult[]): Promise<BiomarkerResult[]>;
  updateBiomarkerResult(id: number, updates: { value?: number; unit?: string; flagStatus?: string | null }): Promise<BiomarkerResult | undefined>;
  deleteBiomarkerResult(id: number): Promise<boolean>;
  deleteBiomarkerResultsByTest(bloodTestId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private _profiles: Map<number, Profile> = new Map();
  private _bloodTests: Map<number, BloodTest> = new Map();
  private _biomarkerResults: Map<number, BiomarkerResult> = new Map();
  private nextProfileId = 1;
  private nextTestId = 1;
  private nextResultId = 1;

  // Profiles
  async getProfiles(): Promise<Profile[]> {
    return Array.from(this._profiles.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    return this._profiles.get(id);
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const newProfile: Profile = {
      ...profile,
      id: this.nextProfileId++,
      createdAt: new Date(),
      ethnicity: profile.ethnicity ?? null,
      notes: profile.notes ?? null,
    };
    this._profiles.set(newProfile.id, newProfile);
    return newProfile;
  }

  async updateProfile(id: number, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const profile = this._profiles.get(id);
    if (!profile) return undefined;
    const updated = { ...profile, ...updates };
    this._profiles.set(id, updated);
    return updated;
  }

  async deleteProfile(id: number): Promise<boolean> {
    if (!this._profiles.has(id)) return false;
    this._profiles.delete(id);
    for (const [testId, test] of this._bloodTests) {
      if (test.profileId === id) {
        this._bloodTests.delete(testId);
        for (const [rId, r] of this._biomarkerResults) {
          if (r.bloodTestId === testId) this._biomarkerResults.delete(rId);
        }
      }
    }
    return true;
  }

  // Blood Tests
  async getBloodTests(profileId: number): Promise<BloodTest[]> {
    return Array.from(this._bloodTests.values())
      .filter((t) => t.profileId === profileId)
      .sort((a, b) => b.testDate.localeCompare(a.testDate));
  }

  async getBloodTest(id: number): Promise<BloodTest | undefined> {
    return this._bloodTests.get(id);
  }

  async createBloodTest(test: InsertBloodTest): Promise<BloodTest> {
    const newTest: BloodTest = {
      ...test,
      id: this.nextTestId++,
      createdAt: new Date(),
      labName: test.labName ?? null,
      notes: test.notes ?? null,
      rawText: test.rawText ?? null,
      fileName: test.fileName ?? null,
    };
    this._bloodTests.set(newTest.id, newTest);
    return newTest;
  }

  async updateBloodTest(id: number, updates: Partial<InsertBloodTest>): Promise<BloodTest | undefined> {
    const test = this._bloodTests.get(id);
    if (!test) return undefined;
    const updated = { ...test, ...updates };
    this._bloodTests.set(id, updated);
    return updated;
  }

  async deleteBloodTest(id: number): Promise<boolean> {
    if (!this._bloodTests.has(id)) return false;
    this._bloodTests.delete(id);
    for (const [rId, r] of this._biomarkerResults) {
      if (r.bloodTestId === id) this._biomarkerResults.delete(rId);
    }
    return true;
  }

  // Biomarker Results
  async getBiomarkerResults(profileId: number): Promise<BiomarkerResult[]> {
    return Array.from(this._biomarkerResults.values())
      .filter((r) => r.profileId === profileId)
      .sort((a, b) => b.testDate.localeCompare(a.testDate));
  }

  async getBiomarkerResultsByTest(bloodTestId: number): Promise<BiomarkerResult[]> {
    return Array.from(this._biomarkerResults.values()).filter((r) => r.bloodTestId === bloodTestId);
  }

  async createBiomarkerResult(result: InsertBiomarkerResult): Promise<BiomarkerResult> {
    const newResult: BiomarkerResult = {
      ...result,
      id: this.nextResultId++,
      flagStatus: result.flagStatus ?? null,
      originalValue: result.originalValue ?? null,
      originalUnit: result.originalUnit ?? null,
    };
    this._biomarkerResults.set(newResult.id, newResult);
    return newResult;
  }

  async createBiomarkerResults(results: InsertBiomarkerResult[]): Promise<BiomarkerResult[]> {
    return Promise.all(results.map((r) => this.createBiomarkerResult(r)));
  }

  async updateBiomarkerResult(id: number, updates: { value?: number; unit?: string; flagStatus?: string | null }): Promise<BiomarkerResult | undefined> {
    const result = this._biomarkerResults.get(id);
    if (!result) return undefined;
    const updated = { ...result, ...updates };
    this._biomarkerResults.set(id, updated);
    return updated;
  }

  async deleteBiomarkerResult(id: number): Promise<boolean> {
    if (!this._biomarkerResults.has(id)) return false;
    this._biomarkerResults.delete(id);
    return true;
  }

  async deleteBiomarkerResultsByTest(bloodTestId: number): Promise<boolean> {
    for (const [rId, r] of this._biomarkerResults) {
      if (r.bloodTestId === bloodTestId) this._biomarkerResults.delete(rId);
    }
    return true;
  }
}

export const storage = new MemStorage();
