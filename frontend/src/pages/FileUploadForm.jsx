import { useState, useEffect } from "react";


import "../styles/FileUploadForm.css";

export default function FileUploadForm() {
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]); 
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [acl, setAcl] = useState([]); 
  const [fileName, setFileName] = useState(""); 

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      setFileName(selectedFile.name); 
    }
  };

  const handleDescriptionChange = (event) => {
    setDescription(event.target.value);
  };

  const addAclEntry = () => {
    setAcl([...acl, { user: "", permission: "read" }]);
  };

  const updateAclEntry = (index, field, value) => {
    const newAcl = [...acl];
    newAcl[index][field] = value;
    setAcl(newAcl);
  };

  const deleteAclEntry = (index) => {
    const newAcl = acl.filter((entry, idx) => idx !== index);
    setAcl(newAcl);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      alert("Please select a file before submitting.");
      return;
    }
    

    const formData = new FormData();
    formData.append("file", file);
    formData.append("description", description);
    formData.append("acl", JSON.stringify(acl)); 

    try {
      const response = await fetch("http://localhost:8080", {  
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Upload Response:", responseData);

        const uploadedFile = {
          name: responseData.name || file.name,
          uploadedBy: responseData.uploadedBy || "admin", 
          lastAccessed: responseData.lastAccessed || new Date().toISOString().split("T")[0],
          accessCount: responseData.accessCount || 0, 
        };

        setFiles((prevFiles) => [...prevFiles, uploadedFile]); 
        console.log("Updated Files State:", files); 

        alert("File uploaded successfully!");
        setFile(null);
        setDescription("");
        setShowUploadForm(false);
        setAcl([]); 
        setFileName(""); 
      } else {
        alert("Failed to upload file.");
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to server.");
    }
    
  };

  

  return (
    <>
      <div className="form-container">
        <h2 className="files-title">Files</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <label htmlFor="file-upload" className="input-btn">Choose File</label>
            <input
              id="file-upload"
              type="file"
              accept="*"
              onChange={handleFileChange}
              className="file-input"
            />
            
            {fileName && <span className="file-name">{fileName}</span>}
          </div>

          <textarea
            placeholder="Enter file description..."
            value={description}
            onChange={handleDescriptionChange}
            className="description-input"
          ></textarea>

          <h3 className="acl-title">Access Control List</h3>
          <div className="acl-container">
            {acl.length === 0 ? (
              <p className="no-acl-message">No ACL entries added yet.</p>
            ) : (
              acl.map((entry, index) => (
                <div key={index} className="acl-entry">
                  <input
                    type="text"
                    placeholder="User/Group"
                    value={entry.user}
                    onChange={(e) => updateAclEntry(index, "user", e.target.value)}
                  />
                  <select
                    value={entry.permission}
                    onChange={(e) => updateAclEntry(index, "permission", e.target.value)}
                  >
                    <option value="read">Read</option>
                    <option value="write">Write</option>
                    <option value="read-write">Read & Write</option>
                  </select>
                  <button type="button" onClick={() => deleteAclEntry(index)} className="delete-acl-btn">
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="button-container">
            <button type="button" onClick={addAclEntry} className="add-acl-btn">
              + Add ACL
            </button>
            <button type="submit" className="upload-btn">Upload</button>
          </div>
        </form>

        <div className="file-table-container">
          <table className="file-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Uploaded By</th>
                <th>Last Accessed</th>
                <th>Access Count</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.length > 0 ? (
                files.map((file, index) => (
                  <tr key={index}>
                    <td className="file-name">{file.name}</td>
                    <td>{file.uploadedBy}</td>
                    <td>{file.lastAccessed}</td>
                    <td>{file.accessCount}</td>
                    <td className="actions">
                      <button className="download-btn">⬇</button>
                      <button className="info-btn">ℹ</button>
                      <button className="more-btn">⋮</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "#888" }}>
                    No files uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
