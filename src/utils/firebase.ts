import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocFromServer,
  collection,
  getDocs,
  query,
  limit,
  serverTimestamp 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { 
  UserProfile, 
  DiagnosticData, 
  DiagnosticResult, 
  GeneratedPlans, 
  FlashcardItem, 
  SpacedReviewItem, 
  WeeklyCheckin, 
  StudyJournalEntry, 
  QuestionStreakState, 
  QuestionRecord, 
  SubjectLearningGoal,
  DailyChallengesState 
} from "../types";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with configured database ID (Required)
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Connection test as required by Firebase integration
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client appears offline or connecting.");
    }
  }
}
testConnection();

// Error Handling helper adhering to FirestoreErrorInfo format
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Full user study progress state bundle
export interface FullUserProgressData {
  profile: UserProfile;
  diagnosticData: DiagnosticData | null;
  diagnosticResult: DiagnosticResult | null;
  plans: GeneratedPlans | null;
  flashcards: FlashcardItem[];
  spacedReviews: SpacedReviewItem[];
  streakState: QuestionStreakState;
  questionRecords: QuestionRecord[];
  dailyChallenges: DailyChallengesState | null;
  journalEntries: StudyJournalEntry[];
  checkins: WeeklyCheckin[];
  learningGoals: SubjectLearningGoal[];
  lastSyncedAt?: string;
}

/**
 * Save user study progress to Firestore
 */
export async function saveUserProgressToFirestore(
  userId: string,
  progress: FullUserProgressData
): Promise<void> {
  const docPath = `users/${userId}/progress/main`;
  try {
    const cleanPayload = JSON.parse(
      JSON.stringify({
        userId,
        ...progress,
        updatedAt: new Date().toISOString(),
      })
    );
    await setDoc(doc(db, "users", userId, "progress", "main"), cleanPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Load user study progress from Firestore
 */
export async function loadUserProgressFromFirestore(
  userId: string
): Promise<FullUserProgressData | null> {
  const docPath = `users/${userId}/progress/main`;
  try {
    const progressDoc = await getDoc(doc(db, "users", userId, "progress", "main"));
    if (progressDoc.exists()) {
      return progressDoc.data() as FullUserProgressData;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

/**
 * Ensure user document exists in /users/{userId}
 */
export async function syncUserAccountRecord(user: User): Promise<void> {
  const docPath = `users/${user.uid}`;
  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        userId: user.uid,
        email: user.email || "",
        displayName: user.displayName || user.email?.split("@")[0] || "Estudante",
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Auth helper: Sign in or register with Google Popup
 */
export async function loginWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  await syncUserAccountRecord(credential.user);
  return credential.user;
}

/**
 * Auth helper: Register with Email and Password
 */
export async function registerWithEmail(email: string, pass: string, name?: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && credential.user) {
    try {
      await updateProfile(credential.user, { displayName: name });
    } catch (e) {
      console.warn("Could not set displayName on auth user:", e);
    }
  }
  await syncUserAccountRecord(credential.user);
  return credential.user;
}

/**
 * Auth helper: Sign in with Email and Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  await syncUserAccountRecord(credential.user);
  return credential.user;
}

/**
 * Auth helper: Sign out
 */
export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export interface CommunityMetricItem {
  userId: string;
  displayName: string;
  objective: string;
  averageAccuracy: number;
  totalHoursCompleted: number;
  checkinsCount: number;
  streakDays: number;
  totalQuestionsAnswered: number;
  subjectAccuracies: { subject: string; accuracy: number; weeklyHours?: number }[];
  updatedAt: string;
}

/**
 * Publish / Update student's real anonymized study metric to Firestore
 */
export async function publishCommunityMetric(userId: string, data: Partial<CommunityMetricItem>): Promise<void> {
  const docPath = `communityMetrics/${userId}`;
  try {
    const payload = JSON.parse(
      JSON.stringify({
        userId,
        displayName: auth.currentUser?.displayName || "Estudante",
        objective: data.objective || "Estudos Gerais",
        averageAccuracy: Number(data.averageAccuracy) || 0,
        totalHoursCompleted: Number(data.totalHoursCompleted) || 0,
        checkinsCount: Number(data.checkinsCount) || 0,
        streakDays: Number(data.streakDays) || 0,
        totalQuestionsAnswered: Number(data.totalQuestionsAnswered) || 0,
        subjectAccuracies: data.subjectAccuracies || [],
        updatedAt: new Date().toISOString(),
      })
    );
    await setDoc(doc(db, "communityMetrics", userId), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Read real community metrics contributed by registered students in Firestore
 */
export async function fetchCommunityMetrics(): Promise<CommunityMetricItem[]> {
  const colPath = "communityMetrics";
  try {
    const colRef = collection(db, colPath);
    const snap = await getDocs(query(colRef, limit(100)));
    const list: CommunityMetricItem[] = [];
    snap.forEach((d) => {
      const data = d.data() as CommunityMetricItem;
      if (data && data.userId) {
        list.push(data);
      }
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, colPath);
  }
}
