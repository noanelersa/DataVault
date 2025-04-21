import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Bell, Upload, Download, FileText, Users, AlertTriangle, MoreVertical, Share2, UserPlus, Clock, Info, ArrowLeft } from 'lucide-react';

// const socket = io("localhost:2512"); // Connect to the server

const FileManagementSystem = () => {
  const [page, setPage] = useState('files');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const fileInputRef = useRef(null);

  const [mockFiles, setMockFiles] = useState([
    { 
      id: 1, 
      name: 'report.pdf', 
      uploadedBy: 'admin', 
      uploadDate: '2024-12-20 14:30',
      lastAccessed: '2024-12-26', 
      accessCount: 3,
      size: '2.4 MB',
      type: 'PDF Document',
      sharedWith: [
        { id: 1, name: 'user1', access: 'read' },
        { id: 2, name: 'user2', access: 'write' }
      ],
      accessHistory: [
        { user: 'user1', action: 'viewed', date: '2024-12-26 15:45' },
        { user: 'user2', action: 'downloaded', date: '2024-12-25 11:20' },
        { user: 'admin', action: 'modified', date: '2024-12-24 09:15' }
      ]
    },
    { 
      id: 2, 
      name: 'data.xlsx', 
      uploadedBy: 'user1',
      uploadDate: '2024-12-22 09:15', 
      lastAccessed: '2024-12-25', 
      accessCount: 5,
      size: '1.8 MB',
      type: 'Excel Spreadsheet',
      sharedWith: [
        { id: 3, name: 'user3', access: 'read' }
      ],
      accessHistory: [
        { user: 'user3', action: 'viewed', date: '2024-12-25 16:30' },
        { user: 'user1', action: 'modified', date: '2024-12-24 14:20' }
      ]
    }
  ]);

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.info(`File uploaded: ${file.name}`);

      const newFile = {
        id: mockFiles.length + 1,
        name: file.name,
        uploadedBy: '7075ed12', // assuming current user is admin
        uploadDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
        lastAccessed: new Date().toISOString().slice(0, 10),
        accessCount: 0,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type || 'Unknown',
        sharedWith: [{ id: 1, name: 'user1', access: 'read' },{ id: 2, name: 'user2', access: 'read' }],
        accessHistory: [
          { user: '7075ed12', action: 'uploaded', date: new Date().toISOString().slice(0, 16).replace('T', ' ') }
        ]
      };

      fetch('http://localhost:2513/register', {
        method: 'POST', // Specify the HTTP method (POST in this case)
        headers: {
          'Content-Type': 'application/json', // Set content type to JSON
        },
        body: JSON.stringify(newFile), // Convert the data to JSON string
      })
        .then((response) => response.json()) // Parse the JSON response
        .then((data) => {
          setResponseMessage('Data sent successfully!');
          console.log('Response:', data); // Log the response data from the server
        })
        .catch((error) => {
          console.error('Error:', error);
          setResponseMessage('Error sending data');
        });

      setMockFiles([...mockFiles, newFile]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const FileDropdown = ({ file }) => (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setActiveDropdown(activeDropdown === file.id ? null : file.id)}
      >
        <MoreVertical size={16} />
      </Button>
      {activeDropdown === file.id && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
              <Share2 size={16} className="mr-2" />
              Share Link
            </button>
            <div className="px-4 py-2 text-sm text-gray-700">
              <div className="font-medium mb-2 flex items-center justify-between">
                Shared with
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <UserPlus size={14} />
                </Button>
              </div>
              {file.sharedWith.map(user => (
                <div key={user.id} className="flex items-center justify-between py-1">
                  <span>{user.name}</span>
                  <span className="text-xs text-gray-500">{user.access}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const FileInfoView = ({ file, onBack }) => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" /> Back to Files
        </Button>
        <h2 className="text-2xl font-bold">{file.name}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>File Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="text-sm text-gray-900">{file.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Size</dt>
                <dd className="text-sm text-gray-900">{file.size}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Uploaded by</dt>
                <dd className="text-sm text-gray-900">{file.uploadedBy}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Upload date</dt>
                <dd className="text-sm text-gray-900">{file.uploadDate}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-gray-500">Last accessed</dt>
                <dd className="text-sm text-gray-900">{file.lastAccessed}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shared With</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {file.sharedWith.map(user => (
                <div key={user.id} className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{user.access}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Access History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {file.accessHistory.map((access, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">
                    <span className="font-medium">{access.user}</span> {access.action}
                  </span>
                  <span className="text-xs text-gray-500">{access.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderFiles = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Files</h2>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button onClick={triggerFileInput}>
            <Upload className="mr-2" size={16} /> Upload New File
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Accessed</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Access Count</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockFiles.map(file => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{file.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.uploadedBy}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.lastAccessed}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.accessCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center space-x-2">
                  <Button variant="ghost" size="sm"><Download size={16} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(file)}>
                    <Info size={16} />
                  </Button>
                  <FileDropdown file={file} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Alerts</h2>
      <div className="space-y-2">
        {[
          { id: 1, message: 'User1 accessed report.pdf', time: '2 hours ago' },
          { id: 2, message: 'User2 downloaded data.xlsx', time: '1 day ago' }
        ].map(alert => (
          <div key={alert.id} className="flex items-center p-4 border rounded bg-white">
            <AlertTriangle className="mr-2 text-yellow-500" size={16} />
            <div>
              <p className="text-sm font-medium">{alert.message}</p>
              <p className="text-xs text-gray-500">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Users</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[
              { id: 1, name: 'user1', lastActive: '2024-12-26' },
              { id: 2, name: 'user2', lastActive: '2024-12-24' }
            ].map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" onClick={() => activeDropdown && setActiveDropdown(null)}>
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex space-x-4">
              <Button variant={page === 'files' ? 'default' : 'ghost'} onClick={() => setPage('files')}>
                <FileText className="mr-2" size={16} /> Files
              </Button>
              <Button variant={page === 'alerts' ? 'default' : 'ghost'} onClick={() => setPage('alerts')}>
                <Bell className="mr-2" size={16} /> Alerts
              </Button>
              <Button variant={page === 'users' ? 'default' : 'ghost'} onClick={() => setPage('users')}>
                <Users className="mr-2" size={16} /> Users
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {selectedFile ? (
          <FileInfoView file={selectedFile} onBack={() => setSelectedFile(null)} />
        ) : (
          {
            'files': renderFiles(),
            'alerts': renderAlerts(),
            'users': renderUsers(),
          }[page]
        )}
      </div>
    </div>
  );
};

export default FileManagementSystem;