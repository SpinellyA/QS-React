import React, { useEffect, useState } from 'react';
import { db } from './firebase'; 
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
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

  function handleDevNameChange(e) {
    setDevName(e.target.value);
  }

  function enqueueByName() {
    const trimmed = devName.trim();
    if(!trimmed) return;
    if (queue.find(p => p.name === trimmed)) return;
    setQueue(prev => [...prev, { name: trimmed, time: new Date() }]);
    setDevName('');
  }

  function dequeueByName() {
    const trimmed = devName.trim();
    if (!trimmed) return;
    setQueue(prev => prev.filter(p => p.name !== trimmed));
    setDevName('');
  }


  useEffect(function () {
    async function init() {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const id = result.visitorId;
      setFingerprint(id);

      const savedName = localStorage.getItem(`name_${id}`);
      if (savedName) {
        setName(savedName);
        setShowModal(false);
      } else {
        setShowModal(true);
      }
    }

    init();
  }, []);

  function handleRegisterName() {
    const trimmed = name.trim();
    if (trimmed === '') return;

    const existingFingerprint = localStorage.getItem(`finger_of_${trimmed}`);
    if (existingFingerprint && existingFingerprint !== fingerprint) {
      alert('This account is already in use on another device.');
      return;
    }

    // Save name + fingerprint
    localStorage.setItem(`name_${fingerprint}`, trimmed);
    localStorage.setItem(`finger_of_${trimmed}`, fingerprint);
    setName(trimmed);
    setShowModal(false);

    // Set admin if name matches
    if (adminAccounts.includes(trimmed)) {
      setIsAdmin(true); 
    }
  }

  function clearQueuue() {
    if (!isAdmin) return;
    if (window.confirm('Are you sure you want to clear the queue?')) {
      setQueue([]);
      alert('Queue cleared!');
    }
  }


  function enqueueUser() {
    if (!name) return;
    if (queue.find(p => p.name === name)) return;
    setQueue(prev => [...prev, { name, time: new Date() }]);
  }

  function dequeueUser() {
    setQueue(prev => prev.filter(p => p.name !== name));
  }

  function nextRow() {
    if (queue.length <= 2) return;
    const firstRow = queue.slice(0, 2);
    const rest = queue.slice(2);
    setQueue([...rest, ...firstRow]);
  }

  function prevRow() {
    if (queue.length <= 2) return;
    const rest = queue.slice(0, -2);
    const lastRow = queue.slice(-2);
    setQueue([...lastRow, ...rest]);
  }

  function alertCurrentPlayers() {
    const current = queue.slice(0, 2).map(p => p.name).join(' & ');
    window.alert(`⏰ ${current || 'No players'} — you have 30 seconds to confirm!`);
  }

  function renderRows() { 
    const rows = [];
    for (let i = 0; i < queue.length; i += 2) {
      rows.push(
        <tr key={i}>
          <td>{queue[i]?.name || ''}</td>
          <td>{queue[i + 1]?.name || ''}</td>
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
            <button onClick={enqueueUser}>Enqueue</button>
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
                  <button onClick={clearQueuue}>Clear Queue</button>
                </div>
                
              </div>
            )}
            <button onClick={dequeueUser}>Dequeue</button>
            <button onClick={nextRow}>Next</button>
            <button onClick={prevRow}>Prev</button>
            <button onClick={alertCurrentPlayers}>Alert!</button>
            <button onClick={() => alert('Pair functionality coming soon!')}>Pair</button>
          </div>
        </>
      )}
    </div>
  );
}

export default QueueSystem;
