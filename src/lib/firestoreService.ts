import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { TripLog, MealLog, EnergyLog, ChatMessage, UserProfile } from "../types";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function setUserProfile(uid: string, profile: Partial<UserProfile>) {
  await setDoc(doc(db, "users", uid), profile, { merge: true });
}

export async function getTrips(uid: string): Promise<TripLog[]> {
  const q = query(collection(db, "trips"), where("userId", "==", uid), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TripLog));
}

export async function addTrip(trip: Omit<TripLog, "id">) {
  const docRef = await addDoc(collection(db, "trips"), {
    ...trip,
    date: Timestamp.fromDate(new Date(trip.date)),
    createdAt: Timestamp.fromDate(new Date(trip.createdAt)),
  });
  return docRef.id;
}

export async function deleteTrip(id: string) {
  await deleteDoc(doc(db, "trips", id));
}

export async function getMeals(uid: string): Promise<MealLog[]> {
  const q = query(collection(db, "meals"), where("userId", "==", uid), orderBy("date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MealLog));
}

export async function addMeal(meal: Omit<MealLog, "id">) {
  const docRef = await addDoc(collection(db, "meals"), {
    ...meal,
    date: Timestamp.fromDate(new Date(meal.date)),
    createdAt: Timestamp.fromDate(new Date(meal.createdAt)),
  });
  return docRef.id;
}

export async function deleteMeal(id: string) {
  await deleteDoc(doc(db, "meals", id));
}

export async function getEnergyLogs(uid: string): Promise<EnergyLog[]> {
  const q = query(collection(db, "energy"), where("userId", "==", uid), orderBy("year", "desc"), orderBy("month", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EnergyLog));
}

export async function addEnergyLog(log: Omit<EnergyLog, "id">) {
  const docRef = await addDoc(collection(db, "energy"), {
    ...log,
    createdAt: Timestamp.fromDate(new Date(log.createdAt)),
  });
  return docRef.id;
}

export async function deleteEnergyLog(id: string) {
  await deleteDoc(doc(db, "energy", id));
}

export async function getChatMessages(uid: string): Promise<ChatMessage[]> {
  const q = query(collection(db, "chats", uid, "messages"), orderBy("timestamp", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate().toISOString() } as ChatMessage));
}

export async function addChatMessage(uid: string, msg: Omit<ChatMessage, "id">) {
  const docRef = await addDoc(collection(db, "chats", uid, "messages"), {
    ...msg,
    timestamp: Timestamp.fromDate(new Date(msg.timestamp)),
  });
  return docRef.id;
}
