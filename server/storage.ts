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
  deleteBloodTest(id: number): Promise<boolean>;

  // Biomarker Results
  getBiomarkerResults(profileId: number): Promise<BiomarkerResult[]>;
  getBiomarkerResultsByTest(bloodTestId: number): Promise<BiomarkerResult[]>;
  createBiomarkerResult(result: InsertBiomarkerResult): Promise<BiomarkerResult>;
  createBiomarkerResults(results: InsertBiomarkerResult[]): Promise<BiomarkerResult[]>;
  deleteBiomarkerResultsByTest(bloodTestId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private profiles: Map<number, Profile> = new Map();
  private bloodTests: Map<number, BloodTest> = new Map();
  private biomarkerResults: Map<number, BiomarkerResult> = new Map();
  private nextProfileId = 1;
  private nextTestId = 1;
  private nextResultId = 1;

  // Profiles
  async getProfiles(): Promise<Profile[]> {
    return Array.from(this.profiles.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getProfile(id: number): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const newProfile: Profile = {
      ...profile,
      id: this.nextProfileId++,
      createdAt: new Date(),
      ethnicity: profile.ethnicity ?? null,
      notes: profile.notes ?? null,
    };
    this.profiles.set(newProfile.id, newProfile);
    return newProfile;
  }

  async updateProfile(id: number, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const profile = this.profiles.get(id);
    if (!profile) return undefined;
    const updated = { ...profile, ...updates };
    this.profiles.set(id, updated);
    return updated;
  }

  async deleteProfile(id: number): Promise<boolean> {
    if (!this.profiles.has(id)) return false;
    this.profiles.delete(id);
    // Cascade delete
    for (const [testId, test] of this.bloodTests) {
      if (test.profileId === id) {
        this.bloodTests.delete(testId);
        for (const [rId, r] of this.biomarkerResults) {
          if (r.bloodTestId === testId) this.biomarkerResults.delete(rId);
        }
      }
    }
    return true;
  }

  // Blood Tests
  async getBloodTests(profileId: number): Promise<BloodTest[]> {
    return Array.from(this.bloodTests.values())
      .filter((t) => t.profileId === profileId)
      .sort((a, b) => b.testDate.localeCompare(a.testDate));
  }

  async getBloodTest(id: number): Promise<BloodTest | undefined> {
    return this.bloodTests.get(id);
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
    this.bloodTests.set(newTest.id, newTest);
    return newTest;
  }

  async deleteBloodTest(id: number): Promise<boolean> {
    if (!this.bloodTests.has(id)) return false;
    this.bloodTests.delete(id);
    for (const [rId, r] of this.biomarkerResults) {
      if (r.bloodTestId === id) this.biomarkerResults.delete(rId);
    }
    return true;
  }

  // Biomarker Results
  async getBiomarkerResults(profileId: number): Promise<BiomarkerResult[]> {
    return Array.from(this.biomarkerResults.values())
      .filter((r) => r.profileId === profileId)
      .sort((a, b) => b.testDate.localeCompare(a.testDate));
  }

  async getBiomarkerResultsByTest(bloodTestId: number): Promise<BiomarkerResult[]> {
    return Array.from(this.biomarkerResults.values()).filter((r) => r.bloodTestId === bloodTestId);
  }

  async createBiomarkerResult(result: InsertBiomarkerResult): Promise<BiomarkerResult> {
    const newResult: BiomarkerResult = {
      ...result,
      id: this.nextResultId++,
      flagStatus: result.flagStatus ?? null,
      originalValue: result.originalValue ?? null,
      originalUnit: result.originalUnit ?? null,
    };
    this.biomarkerResults.set(newResult.id, newResult);
    return newResult;
  }

  async createBiomarkerResults(results: InsertBiomarkerResult[]): Promise<BiomarkerResult[]> {
    return Promise.all(results.map((r) => this.createBiomarkerResult(r)));
  }

  async deleteBiomarkerResultsByTest(bloodTestId: number): Promise<boolean> {
    for (const [rId, r] of this.biomarkerResults) {
      if (r.bloodTestId === bloodTestId) this.biomarkerResults.delete(rId);
    }
    return true;
  }
}

export const storage = new MemStorage();
