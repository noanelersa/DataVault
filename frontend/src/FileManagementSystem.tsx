import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Bell, Upload, Download, FileText, Users, AlertTriangle, MoreVertical, Share2, UserPlus, Clock, Info, ArrowLeft, Settings, Trash2 } from 'lucide-react';
import axios from 'axios';

// const socket = io("localhost:2512"); // Connect to the server

const FileManagementSystem = () => {
  const [page, setPage] = useState('files');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const fileInputRef = useRef(null);

  const [showPermissionModal, setShowPermissionModal] = useState(false); //modal for editing permissions
  const [fileForPermissionEdit, setFileForPermissionEdit] = useState(null); //the file we change the permissions to
  const [editedPermissions, setEditedPermissions] = useState([]); //save the users with updated permissions

  const existingUsers = [
    { id: 1, name: 'roys' },
    { id: 2, name: 'talc' },
    { id: 3, name: 'maorg' },
    { id: 4, name: 'alicem' },
    { id: 5, name: 'taliam' },
    { id: 6, name: 'noan' },
  ];

  let alerts = []
  
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get('http://localhost:8080/file'); 
        console.log("Server response:", response.data); 
        setFiles(response.data);
      } catch (error) {
        console.error('Error fetching files:', error); 
      }
    };
  
    fetchFiles();
  }, []);
  

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.info(`File uploaded: ${file.name}`);

      const newFile = {
        id: files.length + 1,
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

        setFiles((prevFiles) => [...prevFiles, newFile]);
    }
  };

  const getMyAlerts = () => {
      fetch('http://localhost:2513/alerts/user/7075ed12', {
        method: 'GET', 
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then((response) => response.json())
        .then((data) => {
          alerts = data
          console.log('Response:', data);
        })
        .catch((error) => {
          console.error('Error:', error);
          setResponseMessage('Error sending data');
        });
    };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };


  const FileDropdown = ({ file }) => { 
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => setActiveDropdown(activeDropdown === file.id ? null : file.id)}>
        <MoreVertical size={16} />
      </Button>
      {activeDropdown === file.id && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-82 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
          onClick={(e) => e.stopPropagation()}>   
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
              <Button className="flex items-center w-full px-4 py-2 mt-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setFileForPermissionEdit(file);
                setShowPermissionModal(true);
              }}>
                <Settings size={16} className="mr-2" />
                Edit Permissions
              </Button>
            </div>
          </div>
        </div>
      )}
      {showPermissionModal && fileForPermissionEdit && (
        <FilePermissions 
          fileForPermissionEdit={fileForPermissionEdit} 
          setShowPermissionModal={setShowPermissionModal} 
          setFileForPermissionEdit={setFileForPermissionEdit} 
        />
      )}
      </div>
    );
  };

  const FilePermissions = ({ fileForPermissionEdit }) => {
    const [showUserDropdown, setShowUserDropdown] = useState(false); //show users who still have no permissions for the selected file
    const [selectedUserId, setSelectedUserId] = useState(''); 
    const [selectedUserAccess, setSelectedUserAccess] = useState('read'); 
  
    const availableUsers = existingUsers.filter(
      (user) => !fileForPermissionEdit.sharedWith.some((sharedUser) => sharedUser.id === user.id)
    );
  
    const addExistingUserToFile = (userId, userAccess) => {
      const user = existingUsers.find(u => u.id === parseInt(userId));
      if (user) {
        setEditedPermissions(prevPermissions => {
          const existingUser = prevPermissions.find(u => u.id === user.id);
          if (existingUser) {
            return prevPermissions.map(u => 
              u.id === user.id ? { ...u, access: userAccess } : u
            );
          } else {
            return [...prevPermissions, { id: user.id, name: user.name, access: userAccess }];
          }
        });
    
        setFileForPermissionEdit(prev => {
          return {
            ...prev,
            sharedWith: [...prev.sharedWith, { id: user.id, name: user.name, access: userAccess }]
          };
        });
      }
      setShowUserDropdown(false); 
    };
  
    const handleFileUpdate = () => {
      if (!fileForPermissionEdit) return;
    
        const updatedSharedWith = fileForPermissionEdit.sharedWith.map(user => {
        const updated = editedPermissions.find(u => u.id === user.id);
        if (updated) {
          if (updated.access === 'none') { //remove user with 'none' permissions
            return null;
          }
          return { ...user, access: updated.access };
        }
        return user;
      }).filter(user => user !== null); 
    
      const newUsers = editedPermissions.filter(user =>
        !fileForPermissionEdit.sharedWith.some(sharedUser => sharedUser.id === user.id)
      ).map(user => ({
        id: user.id,
        name: user.name,
        access: user.access
      }));
    
      const finalSharedWith = [...updatedSharedWith, ...newUsers];

      fetch("http://localhost:2513/update-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fileForPermissionEdit.name,
          sharedWith: finalSharedWith.map(user => ({
            name: user.name,
            access: user.access
          })),
        }),
      })
      .then(res => res.json())
      .then(data => console.log("Server response:", data))
      .catch(err => console.error("Error while sending to server:", err));
    
      setFiles(prevFiles =>
        prevFiles.map(file => {
          if (file.id === fileForPermissionEdit.id) {
            return { ...file, sharedWith: finalSharedWith };
          }
          return file;
        })
      );
    
      setShowPermissionModal(false);
      setEditedPermissions([]);
    };
    
    
  
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              Edit Permissions - {fileForPermissionEdit?.name}
            </h3>
          </div>
  
          <div className="space-y-2 mb-4">
            {fileForPermissionEdit?.sharedWith.filter(user => {
                const edited = editedPermissions.find(u => u.id === user.id);
                return !(edited && edited.access === 'none'); 
            })
            .map((user) => (
              <div key={user.id} className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Button className="p-1 hover:text-red-700 text-sm font-bold"
                  onClick={() => {
                    setEditedPermissions(prev => {
                      const exists = prev.find(u => u.id === user.id);
                      if (exists) {
                        return prev.map(u =>
                          u.id === user.id ? { ...u, access: 'none' } : u
                        );
                      } else {
                        return [...prev, { id: user.id, access: 'none' }];
                      }
                    });
                  }}>
                    ×
                  </Button>
                  <span>{user.name}</span>
                </div>
                <select
                  className="border rounded p-1 text-sm"
                  defaultValue={user.access}
                  onChange={(e) => {
                    const newAccess = e.target.value;
  
                    setEditedPermissions(prev => {
                      const existing = prev.find(u => u.id === user.id);
                      if (existing) {
                        return prev.map(u =>
                          u.id === user.id ? { ...u, access: newAccess } : u
                        );
                      } else {
                        return [...prev, { id: user.id, access: newAccess }];
                      }
                    });
                  }} >
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="manage">Manage</option>
                </select>
              </div>
            ))}
          </div>
  
         
          <div className="space-y-2 mb-4">
            <Button onClick={() => setShowUserDropdown(!showUserDropdown)}>
              <UserPlus size={16} className="mr-2" />
              Grant permissions to a new user
            </Button>
  
           
            {showUserDropdown && (
              <div className="space-y-2">
                <select
                  className="border rounded p-1 text-sm"
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  value={selectedUserId}
                >
                  <option value="">Select a user to add</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
  
                <select
                  className="border rounded p-1 text-sm"
                  onChange={(e) => setSelectedUserAccess(e.target.value)}
                  value={selectedUserAccess}
                >
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="manage">Manage</option>
                </select>
  
                <Button
                  onClick={() => {
                    if (selectedUserId) {
                      addExistingUserToFile(selectedUserId, selectedUserAccess);
                      setSelectedUserId('');
                      setSelectedUserAccess('read');
                    }
                  }}>
                  Add User
                </Button>
              </div>
            )}
          </div>
  
          <div className="flex justify-end">
            <Button onClick={handleFileUpdate}>Save</Button>
          </div>
        </div>
      </div>
    );
  };

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


  const handleDeleteFile = async (fileName) =>{
    try {
      const response = await fetch(`http://localhost:2513/delete/${fileName}`, {
        method: 'DELETE',
      });
  
      if (response.ok) {
        console.log("File deleted successfully");
        setFiles(prev => prev.filter(file => file.name !== fileName));
      } else {
        console.error("Failed to delete file");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };


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
            {files.map(file => (
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
                  <Button onClick = {() =>handleDeleteFile(file.name)}>
                    <Trash2 size={16}/>
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
        {alerts.map(alert => (
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
              <Button variant={page === 'alerts' ? 'default' : 'ghost'} onClick={() => {
                getMyAlerts()
                setPage('alerts')}}>
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