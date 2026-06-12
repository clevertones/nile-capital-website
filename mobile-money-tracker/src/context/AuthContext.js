import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [agentProfile, setAgentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadAgentProfile(uid) {
    if (!db) {
      setAgentProfile(null);
      return;
    }

    const snap = await getDoc(doc(db, 'agents', uid));
    if (snap.exists()) {
      setAgentProfile(snap.data());
    } else {
      setAgentProfile(null);
    }
  }

  async function signup({ email, password, fullName, phone, network }) {
    if (!auth || !db) {
      throw new Error('Firebase is not configured yet. Add your Firebase env values first.');
    }

    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: fullName });
    await sendEmailVerification(user);

    const profile = {
      uid: user.uid,
      fullName,
      email,
      phone,
      network,
      plan: 'trial',
      trialStartedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'agents', user.uid), profile);
    setAgentProfile(profile);
    return user;
  }

  async function login(email, password) {
    if (!auth) {
      throw new Error('Firebase is not configured yet. Add your Firebase env values first.');
    }

    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await loadAgentProfile(user.uid);
    return user;
  }

  function logout() {
    setAgentProfile(null);
    return auth ? signOut(auth) : Promise.resolve();
  }

  function getTrialDaysLeft() {
    if (!agentProfile?.trialStartedAt) return 30;

    const start = agentProfile.trialStartedAt.toDate?.() ?? new Date(agentProfile.trialStartedAt);
    const elapsed = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(30 - elapsed));
  }

  function isPaidPlan() {
    return agentProfile?.plan === 'standard' || agentProfile?.plan === 'business';
  }

  useEffect(() => {
    if (!auth) {
      setCurrentUser(null);
      setLoading(false);
      return undefined;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadAgentProfile(user.uid);
      } else {
        setAgentProfile(null);
      }
      setLoading(false);
    });

    return unsub;
  }, []);

  const value = {
    currentUser,
    agentProfile,
    loading,
    signup,
    login,
    logout,
    getTrialDaysLeft,
    isPaidPlan,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
