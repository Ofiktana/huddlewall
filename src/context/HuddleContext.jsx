import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { IDENTITY_KEY, SESSION_KEY, genCode, nowISO, uid } from '../utils';

const HuddleContext = createContext(null);

const bucketsCol = collection(db, 'buckets');
const postsCol = collection(db, 'posts');
const BATCH_LIMIT = 500;

function toISO(timestamp) {
  return timestamp ? timestamp.toDate().toISOString() : nowISO();
}

function readSnapshot(snapshot, timestampFields) {
  return snapshot.docs.map((snap) => {
    const data = snap.data({ serverTimestamps: 'estimate' });
    for (const field of timestampFields) data[field] = toISO(data[field]);
    return { id: snap.id, ...data };
  });
}

async function attempt(action, errorMessage) {
  try {
    await action();
    return { ok: true };
  } catch (error) {
    console.error(errorMessage, error);
    return { ok: false, error: errorMessage };
  }
}

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {};
  } catch {
    return {};
  }
}

export function HuddleProvider({ children }) {
  const [bucketDocs, setBucketDocs] = useState(null);
  const [postDocs, setPostDocs] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [session, setSessionState] = useState(readSession);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    function onError(error) {
      console.error('Firestore listener failed', error);
      setLoadError("Couldn't connect to the database. Check your connection and refresh.");
      setBucketDocs((prev) => prev || []);
      setPostDocs((prev) => prev || []);
    }
    const unsubscribeBuckets = onSnapshot(
      bucketsCol,
      (snapshot) => setBucketDocs(readSnapshot(snapshot, ['createdAt'])),
      onError,
    );
    const unsubscribePosts = onSnapshot(
      postsCol,
      (snapshot) => setPostDocs(readSnapshot(snapshot, ['createdAt', 'updatedAt'])),
      onError,
    );
    return () => {
      unsubscribeBuckets();
      unsubscribePosts();
    };
  }, []);

  const loading = bucketDocs === null || postDocs === null;

  const buckets = useMemo(() => {
    if (loading) return [];
    const postsByBucket = new Map();
    for (const { bucketId, ...post } of postDocs) {
      if (!postsByBucket.has(bucketId)) postsByBucket.set(bucketId, []);
      postsByBucket.get(bucketId).push(post);
    }
    const newestFirst = (a, b) => b.createdAt.localeCompare(a.createdAt);
    return bucketDocs
      .map((bucket) => ({ ...bucket, posts: (postsByBucket.get(bucket.id) || []).sort(newestFirst) }))
      .sort(newestFirst);
  }, [bucketDocs, loading, postDocs]);

  const bucketsRef = useRef(buckets);
  bucketsRef.current = buckets;

  const setSession = useCallback((next) => {
    setSessionState(next);
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const clearSession = useCallback(() => {
    setSession({});
  }, [setSession]);

  const toast = useCallback((message) => {
    setToastMessage(message);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const identityFor = useCallback((bucketId, name) => {
    let map = {};
    try {
      map = JSON.parse(localStorage.getItem(IDENTITY_KEY)) || {};
    } catch {
      map = {};
    }
    const key = bucketId + '::' + name.trim().toLowerCase();
    if (!map[key]) {
      map[key] = uid('id');
      try {
        localStorage.setItem(IDENTITY_KEY, JSON.stringify(map));
      } catch {
        /* ignore */
      }
    }
    return map[key];
  }, []);

  const createBucket = useCallback(async (name, code) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: 'Give the bucket a name first' };
    const taken = new Set(bucketsRef.current.map((bucket) => bucket.code));
    let finalCode = (code || '').trim().toUpperCase();
    if (finalCode && taken.has(finalCode)) {
      return { ok: false, error: 'That code is already in use' };
    }
    if (!finalCode) {
      do { finalCode = genCode(); } while (taken.has(finalCode));
    }
    return attempt(
      () => addDoc(bucketsCol, { name: trimmed, code: finalCode, createdAt: serverTimestamp() }),
      "Couldn't create the bucket",
    );
  }, []);

  const renameBucket = useCallback(async (bucketId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Name can't be empty" };
    return attempt(
      () => updateDoc(doc(bucketsCol, bucketId), { name: trimmed }),
      "Couldn't rename the bucket",
    );
  }, []);

  const regenerateCode = useCallback(async (bucketId) => {
    const taken = new Set(bucketsRef.current.map((bucket) => bucket.code));
    let code;
    do { code = genCode(); } while (taken.has(code));
    const result = await attempt(
      () => updateDoc(doc(bucketsCol, bucketId), { code }),
      "Couldn't generate a new code",
    );
    return { ...result, code };
  }, []);

  const deleteBucket = useCallback(async (bucketId) => attempt(async () => {
    const posts = await getDocs(query(postsCol, where('bucketId', '==', bucketId)));
    const refs = posts.docs.map((snap) => snap.ref).concat(doc(bucketsCol, bucketId));
    for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  }, "Couldn't delete the bucket"), []);

  const addPost = useCallback(async (bucketId, post) => attempt(
    () => addDoc(postsCol, {
      ...post,
      bucketId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    "Couldn't post your idea",
  ), []);

  const updatePost = useCallback(async (postId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, error: "Idea can't be empty" };
    return attempt(
      () => updateDoc(doc(postsCol, postId), { text: trimmed, updatedAt: serverTimestamp() }),
      "Couldn't update the idea",
    );
  }, []);

  const deletePost = useCallback(async (postId) => attempt(
    () => deleteDoc(doc(postsCol, postId)),
    "Couldn't delete the idea",
  ), []);

  const value = useMemo(() => ({
    buckets,
    loading,
    loadError,
    session,
    toastMessage,
    toastVisible,
    setSession,
    clearSession,
    toast,
    identityFor,
    createBucket,
    renameBucket,
    regenerateCode,
    deleteBucket,
    addPost,
    updatePost,
    deletePost,
  }), [
    buckets,
    loading,
    loadError,
    session,
    toastMessage,
    toastVisible,
    setSession,
    clearSession,
    toast,
    identityFor,
    createBucket,
    renameBucket,
    regenerateCode,
    deleteBucket,
    addPost,
    updatePost,
    deletePost,
  ]);

  return (
    <HuddleContext.Provider value={value}>
      {children}
    </HuddleContext.Provider>
  );
}

export function useHuddle() {
  const context = useContext(HuddleContext);
  if (!context) throw new Error('useHuddle must be used within HuddleProvider');
  return context;
}
