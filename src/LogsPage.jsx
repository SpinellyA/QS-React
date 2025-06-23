import { useEffect, useState } from "react";
import { db } from './firebase'; 
import { collection, getDocs } from 'firebase/firestore';

function LogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const logsCollection = collection(db, 'logs');
      const logsSnapshot = await getDocs(logsCollection);
      const logs = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(logs);
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>📜 Logs</h2>
      <p>Here’s where your logs will appear...</p>
      {logs.length > 0 ? (
        <ul>
          {logs.map(log => (
            <li key={log.id}>
              <strong>{new Date(log.time).toLocaleString()}</strong>: {log.message}
            </li>
          ))}
        </ul>
      ) : (
        <p>No logs available.</p>
      )}
    </div>
  );
}

export default LogsPage;
