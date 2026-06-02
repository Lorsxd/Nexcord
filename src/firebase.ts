/*
 * Nexcord, a Discord client mod
 * Copyright (c) 2026 Nexcord Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAKEht9maXitplov3zrBtDXXCXN0s-Z9tU",
  authDomain: "dijital-developer-web.firebaseapp.com",
  projectId: "dijital-developer-web",
  storageBucket: "dijital-developer-web.firebasestorage.app",
  messagingSenderId: "90311093347",
  appId: "1:90311093347:web:f40062c0c2782fe2dbdc56",
  measurementId: "G-LSHX3JRJ6C"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
