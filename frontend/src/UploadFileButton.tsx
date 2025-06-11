import { Upload } from 'lucide-react';
import { Button } from './components/ui/button';
import { useState } from 'react';

const UploadFileButton = ({ setFiles, setResponseMessage }) => {
  const handleElectronUpload = async () => {
    const filePath = await window.electronAPI.selectFile();
    if (!filePath) return;

    // Request file metadata from main process via preload
    const stats = await window.electronAPI.readFileMeta(filePath);
    if (!stats) {
      setResponseMessage('Failed to read file metadata.');
      return;
    }

    const newFile = {
      id: Date.now(),
      name: stats.name,
      uploadedBy: localStorage.getItem('userId'),
      uploadDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
      lastAccessed: new Date().toISOString().slice(0, 10),
      accessCount: 0,
      size: stats.size,
      type: stats.name.split('.').pop() || 'Unknown',
      acl: [],
      accessHistory: [],
      fullPath: stats.path
    };

    try {
      const response = await fetch('http://localhost:2513/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        },
        body: JSON.stringify(newFile),
      });
      const data = await response.json();

      setResponseMessage('Data sent successfully!');
      console.log('Response:', data);
      setFiles((prev) => [...prev, newFile]);
    } catch (err) {
      console.error('Error:', err);
      setResponseMessage('Error sending data');
    }
  };

  return (
    <div>
      <Button onClick={handleElectronUpload}>
        <Upload className="mr-2" size={16} /> Upload New File
      </Button>
    </div>
  );
};

export default UploadFileButton;
