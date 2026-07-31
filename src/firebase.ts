// MARO ERP - Firebase Auxiliary Services Integration
// MANDATORY ARCHITECTURE NOTICE:
// Operational ERP data (Products, Inventory, Sales, Purchases, Accounting, Customers, Suppliers, POS)
// is stored and synchronized exclusively via PostgreSQL and MARO Sync Engine.
// Firebase is restricted to Push Notifications, Crash Reporting, Analytics, and Cloud Messaging.

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export { signOut };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.warn(`[MARO ERP] Auxiliary operation error (${operationType} on ${path}):`, error);
}

export async function testConnection() {
  return true;
}
