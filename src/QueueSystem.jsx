import React, { useEffect, useState } from 'react';
import {useNavigate} from 'react-router-dom';
import { db } from './firebase'; 
import { collection, query, addDoc, getDocs, deleteDoc, where, doc, updateDoc, orderBy} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import './index.css';

function QueueSystem() {
  const [queue, setQueue] = useState([]);
  const [name, setName] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [showModal, setShowModal] = useState(true);
  const [devName, setDevName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const adminAccounts = ['Alex', 'Admin'];
  const [isFrozen, setIsFrozen] = useState(false);
  const [isEnqueueing, setIsEnqueueing] = useState(false);

  function handleDevNameChange(e) {
    setDevName(e.target.value);
  }

async function enqueueByName() {
  const trimmed = devName.trim();
  if (!trimmed) return;
  if (queue.find(p => p.name === trimmed)) return;
  await addDoc(collection(db, 'queue'), {
    name: trimmed,
    time: Date.now(),
    fingerprint,
    position: queue.length
  });
  setDevName('');
}

async function dequeueByName() {
  const trimmed = devName.trim();
  if (!trimmed) return;

  const q = query(collection(db, 'queue'), where('name', '==', trimmed));
  const snapshot = await getDocs(q);
  snapshot.forEach(async (docSnap) => {
    await deleteDoc(doc(db, 'queue', docSnap.id));
  });
  setDevName('');
}

  function freezeQueue() {
    if(!isAdmin) return;
    setIsFrozen(!isFrozen);
    if (isFrozen) {
      alert('Queue is now unfrozen.');
    } else {
      alert('Queue is now frozen.');
    }
  }




  useEffect(() => {
    async function init() {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const fpId = result.visitorId;
      setFingerprint(fpId);

      const fpQuery = query(collection(db, 'users'), where('fingerprint', '==', fpId));
      const fpSnapshot = await getDocs(fpQuery);

      if (!fpSnapshot.empty) {
        const existing = fpSnapshot.docs[0].data();
        setName(existing.name);
        setShowModal(false);
        if (adminAccounts.includes(existing.name)) {
          setIsAdmin(true);
        }
        throwLogs(`User ${existing.name} logged in.`);
      }
    }


    init();

    const q = query(collection(db, 'queue'), orderBy('position'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedQueue = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updatedQueue.sort((a, b) => a.position - b.position);
      setQueue(updatedQueue);
    });

    return () => unsubscribe();
  }, []);


function throwLogs(log) {
  const newMessage = Date.now() + ' - ' + log;
  const logElement = addDoc(collection(db, 'logs'), {
    message: newMessage,
    time: Date.now()
  });
}




  async function handleRegisterName() {
    const trimmed = name.trim();
    if (trimmed === '') return;

    const nameQuery = query(collection(db, 'users'), where('name', '==', trimmed));
    const nameSnapshot = await getDocs(nameQuery);

      if (!nameSnapshot.empty) {
        alert('This account is already in use on another device.');
        return;
      }
      await addDoc(collection(db, 'users'), {
        name: trimmed,
        fingerprint,
        time: Date.now()
      });

      setName(trimmed);
      setShowModal(false);
      if (adminAccounts.includes(trimmed)) {
        setIsAdmin(true);
      }

      throwLogs(`User ${trimmed} logged in.`);
    }




async function clearQueue() {
  if (!isAdmin) return;
  if (!window.confirm('Are you sure you want to clear the queue?')) return;

  const snapshot = await getDocs(collection(db, 'queue'));
  const deletions = snapshot.docs.map(docSnap =>
    deleteDoc(doc(db, 'queue', docSnap.id))
  );

  await Promise.all(deletions);
  alert('Queue cleared!');
}


 async function enqueueUser() {
  if(isFrozen) {
    return;
  }
  if (!name) return;
  const exists = queue.find(p => p.name === name);
  if (exists) return;

  setIsEnqueueing(true);

  await addDoc(collection(db, 'queue'), {
    name,
    time: Date.now(),
    fingerprint,
    position: queue.length
  });
  setIsEnqueueing(false);
}

async function dequeueUser() {
  if(isFrozen) {
    return;
  }
  const q = query(collection(db, 'queue'), where('name', '==', name));
  const snapshot = await getDocs(q);
  snapshot.forEach(async (docSnap) => {
    await deleteDoc(doc(db, 'queue', docSnap.id));
  });
}

  function banPlayer(name) { // implement later
    if (!isAdmin) return;
    if (!name) return;
    if (window.confirm(`Are you sure you want to ban ${name}?`)) {
      setQueue(prev => prev.filter(p => p.name !== name));
      alert(`${name} has been banned from the queue.`);
    }
  }

  async function nextRow() {
    if (isFrozen || queue.length <= 2 || !isAdmin) return;

    const firstTwo = queue.slice(0, 2);
    const rest = queue.slice(2);
    const newQueue = [...rest, ...firstTwo];

    for (let i = 0; i < newQueue.length; i++) {
      const entry = newQueue[i];
      await updateDoc(doc(db, 'queue', entry.id), { position: i });
    }
  }

  async function prevRow() {
    if (isFrozen || queue.length <= 2 || !isAdmin) return;

    const lastTwo = queue.slice(-2);
    const rest = queue.slice(0, -2);
    const newQueue = [...lastTwo, ...rest];

    for (let i = 0; i < newQueue.length; i++) {
      const entry = newQueue[i];
      await updateDoc(doc(db, 'queue', entry.id), { position: i });
    }
  }

  function alertCurrentPlayers() {
    const current = queue.slice(0, 2).map(p => p.name).join(' & ');
    window.alert(`⏰ ${current || 'No players'} — you have 30 seconds to confirm!`);
  }

  function renderRows() { 
    const rows = [];
    for (let i = 0; i < queue.length; i += 2) {
      const name1 = queue[i]?.name ?? '';
      const name2 = queue[i + 1]?.name ?? '';

      rows.push(
        <tr key={i}>
          <td>{String(name1)}</td>
          <td>{String(name2)}</td>
        </tr>
      );
    }
    return rows;
  }


  function handleNameChange(e) {
    setName(e.target.value);
  }

  return (
    <div className="queue-container">
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Welcome!</h2>
            <p>Please enter your name to register this device:</p>
            <p>Your fingerprint is: {fingerprint}</p>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="Your name"
            />
            <button onClick={handleRegisterName}>Register</button>
          </div>
        </div>
      )}

      {!showModal && (
        <>
          <h2>Welcome back, {name}!</h2>

          <div className="table-responsive">
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Player 1</th>
                  <th>Player 2</th>
                </tr>
              </thead>
              <tbody>{renderRows()}</tbody>
            </table>
          </div>

          <div className="button-group">
            <button onClick={enqueueUser} disabled={isEnqueueing}>Enqueue</button>
            <button onClick={dequeueUser}>Dequeue</button>
            <button onClick={nextRow}>Next</button>
            <button onClick={prevRow}>Prev</button>
            <button onClick={alertCurrentPlayers}>Alert!</button>
            <button onClick={() => alert('Pair functionality coming soon!')}>Pair</button>
            
            {isAdmin && (
              <div className="dev-panel">
                <h4>Developer Tools</h4>
                <input
                  type="text"
                  placeholder="Name to Enqueue"
                  value={devName}
                  onChange={handleDevNameChange}
                />
                <div className="button-group">
                  <button onClick={enqueueByName}>Enqueue by Name</button>
                  <button onClick={dequeueByName}>Dequeue by Name</button>
                  <button onClick={clearQueue}>Clear Queue</button>
                  <button onClick={freezeQueue}>Freeze Queue</button>
                </div>
                
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default QueueSystem;
