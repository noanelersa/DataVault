import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Bell, Upload, Download, FileText, Users, AlertTriangle, MoreVertical, Share2, UserPlus, Clock, Info, ArrowLeft, Settings, Trash2, Ban } from 'lucide-react';
import axios from 'axios';

// const socket = io("localhost:2512"); // Connect to the server

const FileManagementSystem = () => {
  const [page, setPage] = useState("files");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState("");
  const fileInputRef = useRef(null);

  const [showPermissionModal, setShowPermissionModal] = useState(false); //modal for editing permissions
  const [fileForPermissionEdit, setFileForPermissionEdit] = useState(null); //the file we change the permissions to
  const [editedPermissions, setEditedPermissions] = useState([]); //save the users with updated permissions

  const [alerts, setAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const existingUsers = [
    { id: 1, name: 'roys' },
    { id: 2, name: 'talc' },
    { id: 3, name: 'maorg' },
    { id: 4, name: 'alicem' },
    { id: 5, name: 'taliam' },
    { id: 6, name: 'noan' },
  ];
  
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(`/api/file/shared/${localStorage.getItem("userId")}`, {
          method: 'GET', // or 'POST', 'PUT', etc.
          headers: {
            'Content-Type': 'application/json',
            // Add any other headers if needed
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const json = await response.json();
        setFiles(json);
      } catch (err: any) {
        throw new Error(`HTTP error! Status: ${err}`);
      }
    };
  
    fetchFiles();
  }, []);
  

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    console.info(`File uploaded: ${file.name}`);
    try {
      const command = {
        name: file.name,
        uploadedBy: '7075ed12', // assuming current user is admin
        uploadDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
        lastAccessed: new Date().toISOString().slice(0, 10),
        accessCount: 0,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type || 'Unknown',
        acl: [{ id: 1, name: 'user1', access: 'READ' },{ id: 2, name: 'user2', access: 'READ' }],
        accessHistory: [
          { user: '7075ed12', action: 'uploaded', date: new Date().toISOString().slice(0, 16).replace('T', ' ') }
        ]
      };
  
      console.log("Sending upload command to agent:", command);
  
      const result = await window.agentAPI.sendCommand("upload", command);
  
      console.log("Agent response:", result);
      
      if (result?.status === "success") {
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
  
        setFiles((prevFiles) => [...prevFiles, newFile]);
        setResponseMessage("File uploaded successfully!");
      } else {
        setResponseMessage("Upload failed.");
      }

    } catch (err) {
      console.error("Error: ", err);
      setResponseMessage("Error sending data.");
    }
  };
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const openSharingPopup = (file, setFileForPermissionEdit, setShowPermissionModal) => {
    // Remove existing popup if already open
    const existing = document.getElementById("sharing-popup");
    if (existing) existing.remove();

    const popup = document.createElement("div");
    popup.id = "sharing-popup";
    popup.className = "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] bg-gray-900 text-white shadow-lg rounded-md p-4 z-50";
    popup.innerHTML = `
      <div class="text-lg font-semibold text-center mb-3">Shared With</div>
      <div class="space-y-2 max-h-[200px] overflow-y-auto">
        ${file.acl
          .map(
            (user) => `
          <div class="flex justify-between border-b border-gray-700 pb-1 text-sm">
            <span class="text-white font-medium">${user.username}</span>
            <span class="text-gray-300">${user.access}</span>
          </div>`
          )
          .join("")}
      </div>
      <button id="edit-permissions-btn" class="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-white py-1.5 rounded-md flex justify-center items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="mr-2" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
        </svg>
        Edit Permissions
      </button>
    `;

    // Dismiss when clicking outside
    const closePopup = () => popup.remove();
    setTimeout(() => window.addEventListener("click", closePopup, { once: true }), 0);
    popup.addEventListener("click", (e) => e.stopPropagation());

    document.body.appendChild(popup);

    document.getElementById("edit-permissions-btn")?.addEventListener("click", () => {
      setFileForPermissionEdit(file);
      setShowPermissionModal(true);
      popup.remove();
    });
  };

  const EditPermissionsModal = ({ file, onClose, onSave }) => {
    const accessTypes = ["READ", "WRITE", "MANAGE"];
    const [permissions, setPermissions] = useState([...file.acl]);
    const [newUser, setNewUser] = useState("");
    const [newAccess, setNewAccess] = useState("READ");

    if (!file || !file.acl) {
      return <div className="p-4">No file data.</div>;
    }

    const updatePermission = (index, access) => {
      const updated = [...permissions];
      updated[index].access = access;
      setPermissions(updated);
    };

    const addUser = () => {
      if (newUser.trim() && !permissions.find(p => p.username === newUser)) {
        setPermissions([...permissions, { username: newUser.trim(), access: newAccess }]);
        setNewUser("");
        setNewAccess("READ");
      }
    };

    const removeUser = (username) => {
      setPermissions(permissions.filter(p => p.username !== username));
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background bg-opacity-20">
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[300px] bg-gray-900 text-white shadow-lg rounded-md p-4 z-50">
          <div className="text-lg font-semibold text-center mb-3">Edit Permissions</div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {permissions.map((perm, index) => (
              <div key={perm.username} className="flex justify-between border-b border-gray-700 pb-1 text-sm">
                <span className="font-medium">{perm.username}</span>
                <div className="flex items-center gap-2">
                  <select
                    className="bg-gray-900 text-white border border-gray-600 rounded px-2 py-0.5 text-sm"
                    value={perm.access}
                    onChange={(e) => updatePermission(index, e.target.value)}
                  >
                    {accessTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeUser(perm.username)}
                    className="text-red-400 hover:text-red-500 text-lg leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center mt-4 gap-2">
            <select
              className="bg-gray-900 text-white border border-gray-600 rounded px-2 py-1 text-sm flex-1"
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
            >
              <option value="">Select user</option>
              {existingUsers.map(user => (
                <option key={user.id} value={user.name}>{user.name}</option>
              ))}
            </select>

            <select
              value={newAccess}
              onChange={(e) => setNewAccess(e.target.value)}
              className="bg-gray-900 text-white border border-gray-600 rounded px-2 py-1 text-sm"
            >
              {accessTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <button
              onClick={addUser}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1 rounded-md"
            >
              Add
            </button>
          </div>

          <div className="flex justify-end mt-6 gap-2">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-4 py-1.5 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(permissions)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-md"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  function handleSavePermissions(fileForPermissionEdit, updatedACL) {
    // Update permissions for users in updatedACL
    updatedACL.forEach(item => {      
      fetch(`/api/acl/${fileForPermissionEdit.fileId}/user/${item.username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          access: item.access
        }),
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res;
      })
      .then(data => {
        console.log(`Successfully updated ${item.username}:`, data);
      })
      .catch(err => {
        console.error(`Failed to update ${item.username}:`, err);
      });
    });

    // Find users to remove (in fileForPermissionEdit.acl but NOT in updatedACL)
    const updatedUsernames = new Set(updatedACL.map(item => item.username));

    fileForPermissionEdit.acl.forEach(user => {
      if (!updatedUsernames.has(user.username)) {
        fetch(`/api/acl/${fileForPermissionEdit.fileId}/user/${user.username}`, {
          method: "DELETE",
          credentials: 'include',
        })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res;
        })
        .then(data => {
          console.log(`Successfully deleted permission for ${user.username}:`, data);
        })
        .catch(err => {
          console.error(`Failed to delete permission for ${user.username}:`, err);
        });
      }
    });

    // Clear the file being edited and close the modal
    setFileForPermissionEdit(null);
    setShowPermissionModal(false);
  }



  const FileDropdown = ({ file }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [permissions, setPermissions] = useState(file.acl || []);

    return (
      <div className="relative" onClick={e => e.stopPropagation()}>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => openSharingPopup(file, setFileForPermissionEdit, setShowPermissionModal)}>
          <MoreVertical size={16} />
        </Button>
        {activeDropdown !== null && (
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
                {file.acl.map(user => (
                  <div key={user.username} className="flex items-center justify-between py-1">
                    <span>{user.username}</span>
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
          <EditPermissionsModal
            file={fileForPermissionEdit}
            onClose={() => setShowPermissionModal(false)}
            onSave={(updatedACL) => handleSavePermissions(fileForPermissionEdit, updatedACL)}
          />
        )}
      </div>
    );
  };

  const FileInfoView = ({ file, onBack }) => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} className="mr-2" /> Back to Files
        </Button>
        <h2 className="text-2xl font-bold">{file.originalFileName.split('\\').pop()}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>File Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-white-500">Type</dt>
                <dd className="text-sm text-white-900">{file.originalFileName.split('\\').pop().split('.').pop()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-white-500">Size</dt>
                <dd className="text-sm text-white-900">{file.size}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-white-500">Uploaded by</dt>
                <dd className="text-sm text-white-900">{file.owner}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium text-white-500">Upload date</dt>
                <dd className="text-sm text-white-900">{file.uploadTime.split(' ')[0]}</dd>
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
              {file.acl.map(user => (
                <div key={user.username} className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">{user.username}</span>
                  <span className="text-xs bg-black-100 px-2 py-1 rounded">{user.access}</span>
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
              {/*{file.alerts.map((access, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm">
                    <span className="font-medium">{access.user}</span>{" "}
                    {access.action}
                  </span>
                  <span className="text-xs text-gray-500">{access.date}</span>
                </div>
              ))}*/}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  const handleDeleteFile = async (fileName: string) => {
    try {
      const response = await window.agentAPI.sendCommand("delete", {
        name: fileName,
      });
  
      if (response.status === "success") {
        console.log("File deleted successfully");
        setFiles(prev => prev.filter(file => file.name !== fileName));
        setFileName("");
      } else {
        console.log("Failed to delete file: " + response.message);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file");
    }
  };


  const handleDeleteFile = async (fileId) =>{
    try {
      const response = await fetch(`/api/file/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
  
      if (response.ok) {
        console.log("File deleted successfully");
        setFiles(prev => prev.filter(file => file.name !== fileId));
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
        <table className="min-w-full divide-y divide-gray-600 text-white">
          <thead className="bg-transparent">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Uploaded By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Uploaded Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">File Hash</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-gray-600">
            {files.map(file => (
              <tr key={file.fileId} className="hover:bg-gray-800/30">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{file.originalFileName.split('\\').pop()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{file.owner}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{file.uploadTime.split(' ')[0]}</td>
                <td
                  className="relative px-6 py-4 whitespace-nowrap text-sm text-white cursor-pointer group"
                  onClick={() => navigator.clipboard.writeText(file.originalFileHash)}
                >
                  {file.originalFileHash.slice(0, 8)}...

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    Click to copy
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center space-x-2">
                  {/* <Button variant="ghost" size="sm"><Download size={16} /></Button> */}
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(file)}>
                    <Info size={16} />
                  </Button>
                  <Button onClick = {() =>handleDeleteFile(file.fileId)}>
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

  const getMyAlerts = () => {
    fetch(`/api/alerts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => response.json())
      .then((data) => {
        const userId = localStorage.getItem("userId");
        const filteredData = data.filter(item => item.file.owner.username === userId);
        setAlerts(filteredData);
      })
      .catch((error) => {
        setResponseMessage('Error sending data');
      });
  };
  const renderAlertDetails = () => (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => setSelectedAlert(null)}>
        <ArrowLeft className="mr-2" size={16} />
        Back to Alerts
      </Button>

      <h2 className="text-2xl font-bold">Alert #{selectedAlert.alertId} Details</h2>

      <div className="p-4 border rounded bg-transparent space-y-2">
        <p><strong>Message:</strong> {selectedAlert.message.replace("user", selectedAlert.user.username)}</p>
        <p><strong>User:</strong> {selectedAlert.user.username}</p>
        <p><strong>Action:</strong> {selectedAlert.action}</p>
        <p><strong>Severity:</strong> {selectedAlert.severity}</p>
        <p><strong>Created At:</strong> {selectedAlert.createdAt.replace('T',' - ').split('.')[0]}</p>
        <p><strong>File:</strong> {selectedAlert.file.fileName.split("\\").pop()}</p>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Alerts</h2>
        <p className="text-xs text-gray-500">Click on an alert for more info</p>
      </div>
      <div className="space-y-2">
        {alerts.map(alert => {
          let Icon;
          let class_name;
          switch (alert.severity) {
            case 1:
              Icon = Info;
              class_name = "mr-2 text-blue-500";
              break;
            case 2:
              Icon = AlertTriangle;
              class_name = "mr-2 text-yellow-500";
              break;
            case 3:
              Icon = Ban;
              class_name = "mr-2 text-red-500";
              break;
            default:
              Icon = Info;
          }

          return (
            <div
              key={alert.alertId}
              className="flex items-center p-4 border rounded bg-transparent cursor-pointer hover:bg-gray-800/30 transition"
              onClick={() => setSelectedAlert(alert)}
            >
              <Icon className={class_name} size={16} />
              <div>
                <p className="text-sm font-medium">{alert.message.replace("user", alert.user.username)}</p>
                <p className="text-xs text-gray-500">{alert.createdAt.replace('T', ' - ').split('.')[0]}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );


  const renderUsers = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Users</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-transparent">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Last Active</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-white">
            {[
              { id: 1, name: 'user1', lastActive: '2024-12-26' },
              { id: 2, name: 'user2', lastActive: '2024-12-24' }
            ].map(user => (
              <tr key={user.id} className="hover:bg-gray-800/30">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{user.lastActive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const useAlertNotifications = () => {
    const previousAlertCountRef = useRef(0);

    useEffect(() => {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }

      const fetchAlerts = () => getMyAlerts(setAlerts);

      // First fetch immediately
      fetchAlerts();

      // Fetch every minute
      const interval = setInterval(fetchAlerts, 60000);

      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      if (alerts.length > previousAlertCountRef.current) {
        if (Notification.permission === "granted") {
          new Notification("New Alert!", {
            body: "A new alert has been received.",
            icon: "/icon.png", // optional
          });
        }
      }

      // Update stored count every time alerts change
      previousAlertCountRef.current = alerts.length;
    }, [alerts]);
  };
  useAlertNotifications();

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0a1128] via-[#1b2a49] to-[#0a1128] text-white font-sans"
      onClick={() => activeDropdown && setActiveDropdown(null)} >
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex space-x-4">
              <Button
                variant={page === "files" ? "default" : "ghost"}
                onClick={() => setPage("files")}
              >
                <FileText className="mr-2" size={16} /> Files
              </Button>
              <Button variant={page === 'alerts' ? 'default' : 'ghost'} onClick={() => {
                getMyAlerts()
                setPage('alerts')}}>
                <Bell className="mr-2" size={16} /> Alerts
              </Button>
              <Button
                variant={page === "users" ? "default" : "ghost"}
                onClick={() => setPage("users")}
              >
                <Users className="mr-2" size={16} /> Users
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {selectedFile ? (
          <FileInfoView file={selectedFile} onBack={() => setSelectedFile(null)} />
          ) : page === 'alerts' ? (
            selectedAlert ? renderAlertDetails() : renderAlerts()
          ) : (
            {
              files: renderFiles(),
              users: renderUsers(),
            }[page]
        )}
      </div>
    </div>
  );
};

export default FileManagementSystem;
