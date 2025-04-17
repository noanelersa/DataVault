# Frontend Documentation

This is the frontend for the file management system. Below are the important actions and parameters used when interacting with the backend.

## Action 1: Register File

When a request is made to register a new file, the following action occurs:

- **Action Type**: `REGISTER_FILE`  
- **Action Number**: 1  
- **Request URL**: `/register`  
- **Method**: POST  
- **Parameters**:
    - **name** (string): The name of the file being registered.
    - **sharedWith** (array): A list of users the file will be shared with. Each user is represented by an object with the following properties:
        - **name** (string): The name of the user.
        - **access** (string): The access level granted to the user. Can be either `"read"` or `"write"`.

### Example of a request payload:
```json
{
    "name": "exampleFile.txt",
    "sharedWith": [
        {"name": "User1", "access": "read"},
        {"name": "User2", "access": "write"}
    ]
}
```

## Action 2: Update Permissions

This request updates the sharing permissions for a file.

- **Action Type**: `UPDATE_PERMISSIONS`  
- **Action Number**: 2  
- **Request URL**: `/update-permissions`  
- **Method**: POST  
- **Parameters**:
    - **name** (string): The name of the file to update.
    - **sharedWith** (array): Updated list of users and their respective access permissions. Each user is represented by an object with the following properties:
        - **name** (string): The name of the user.
        - **access** (string): The access level granted to the user. Can be either `"read"` or `"write"`.

### Example of a request payload:
```json
{
    "name": "exampleFile.txt",
    "sharedWith": [
        {"name": "User1", "access": "write"},
        {"name": "User2", "access": "read"}
    ]
}
```


## Action 3: Delete File

This request deletes a file from the system.

- **Action Type**: `DELETE_FILE`  
- **Action Number**: 3  
- **Request URL**: `/delete/<file_id>`  
- **Method**: DELETE  
- **Parameters**:
    - **file_id** (string): The unique identifier of the file to delete.

### Example of a request payload:
There is no body required for this request. The file ID is passed as part of the URL.
