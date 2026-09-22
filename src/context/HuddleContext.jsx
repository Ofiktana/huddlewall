import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { seedState } from '../data/dummyData';
import { IDENTITY_KEY, SESSION_KEY, STATE_KEY, genCode, nowISO, uid } from '../utils';

const HuddleContext = createContext(null);

function readBuckets() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.buckets)) return parsed.buckets;
    }
  } catch {
    /* fall through to seed data */
  }
  const seeded = seedState();
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(seeded));
  } catch {
    /* storage unavailable — keep the seed in memory */
  }
  return seeded.buckets;
}

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {};
  } catch {
    return {};
  }
}

function writeBuckets(buckets) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({ buckets }));
  } catch {
    /* ignore quota / private mode */
  }
}

export function HuddleProvider({ children }) {
  const [buckets, setBuckets] = useState(readBuckets);
  const [session, setSessionState] = useState(readSession);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const bucketsRef = useRef(buckets);
  const toastTimer = useRef(null);

  bucketsRef.current = buckets;

  useEffect(() => {
    function onStorage(event) {
      if (event.key !== STATE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue);
        if (Array.isArray(parsed.buckets)) {
          bucketsRef.current = parsed.buckets;
          setBuckets(parsed.buckets);
        }
      } catch {
        /* ignore malformed updates from another tab */
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateBuckets = useCallback((updater) => {
    const next = updater(bucketsRef.current);
    bucketsRef.current = next;
    writeBuckets(next);
    setBuckets(next);
    return next;
  }, []);

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

  const createBucket = useCallback((name, code) => {
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
    updateBuckets((prev) => [
      { id: uid('b'), name: trimmed, code: finalCode, createdAt: nowISO(), posts: [] },
      ...prev,
    ]);
    return { ok: true };
  }, [updateBuckets]);

  const renameBucket = useCallback((bucketId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: "Name can't be empty" };
    updateBuckets((prev) => prev.map((bucket) => (
      bucket.id === bucketId ? { ...bucket, name: trimmed } : bucket
    )));
    return { ok: true };
  }, [updateBuckets]);

  const regenerateCode = useCallback((bucketId) => {
    let code = '';
    updateBuckets((prev) => {
      const taken = new Set(prev.map((bucket) => bucket.code));
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      do {
        code = '';
        for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
      } while (taken.has(code));
      return prev.map((bucket) => (bucket.id === bucketId ? { ...bucket, code } : bucket));
    });
    return code;
  }, [updateBuckets]);

  const deleteBucket = useCallback((bucketId) => {
    updateBuckets((prev) => prev.filter((bucket) => bucket.id !== bucketId));
  }, [updateBuckets]);

  const resetDemo = useCallback(() => {
    updateBuckets(() => seedState().buckets);
  }, [updateBuckets]);

  const addPost = useCallback((bucketId, post) => {
    const stamp = nowISO();
    updateBuckets((prev) => prev.map((bucket) => {
      if (bucket.id !== bucketId) return bucket;
      return {
        ...bucket,
        posts: [{ id: uid('p'), createdAt: stamp, updatedAt: stamp, ...post }, ...bucket.posts],
      };
    }));
  }, [updateBuckets]);

  const updatePost = useCallback((bucketId, postId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, error: "Idea can't be empty" };
    const stamp = nowISO();
    updateBuckets((prev) => prev.map((bucket) => {
      if (bucket.id !== bucketId) return bucket;
      return {
        ...bucket,
        posts: bucket.posts.map((post) => (
          post.id === postId ? { ...post, text: trimmed, updatedAt: stamp } : post
        )),
      };
    }));
    return { ok: true };
  }, [updateBuckets]);

  const deletePost = useCallback((bucketId, postId) => {
    updateBuckets((prev) => prev.map((bucket) => {
      if (bucket.id !== bucketId) return bucket;
      return { ...bucket, posts: bucket.posts.filter((post) => post.id !== postId) };
    }));
  }, [updateBuckets]);

  const value = useMemo(() => ({
    buckets,
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
    resetDemo,
    addPost,
    updatePost,
    deletePost,
  }), [
    buckets,
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
    resetDemo,
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
