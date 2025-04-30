import './App.css'
import FileUploadPage from './pages/FileUploadForm';
import AlertsPage from './pages/AlertsPage'; // ייבוא עמוד ההתרעות
import { useState } from 'react';

function App() {
  const [currentTab, setCurrentTab] = useState('files'); // מצב שמנהל איזו לשונית מוצגת

  return (
      <div>
        <div className="tabs">
          <button onClick={() => setCurrentTab('files')}>Files</button>
          <button onClick={() => setCurrentTab('alerts')}>Alerts</button>
        </div>

        {currentTab === 'files' && <FileUploadPage />}
        {currentTab === 'alerts' && <AlertsPage />}
      </div>
  )
}

export default App;
