package datavault.server.controllers;

import datavault.server.dto.AclDTO;
import datavault.server.entities.FileEntity;
import datavault.server.enums.Action;
import datavault.server.services.AclService;
import datavault.server.services.FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/acl")
public class AclController {
    @Autowired
    private AclService aclService;
    @Autowired
    private FileService fileService;

    @PutMapping("/{fileId}/user/{username}")
    public ResponseEntity<String> updateAclForUser(@PathVariable String fileId, @PathVariable String username,  @RequestBody AclDTO updatedAcl) {
        FileEntity file = fileService.getFileByFileId(fileId);
        aclService.updateAcl(file, username, updatedAcl.access());
        return ResponseEntity.ok("ACL updated successfully for user");
    }
    @DeleteMapping("/{fileId}/user/{username}")
    public ResponseEntity<String> deleteAclForUser(@PathVariable String fileId, @PathVariable String username) {
        FileEntity file = fileService.getFileByFileId(fileId);
        aclService.removeAcl(file, username);
        return ResponseEntity.ok("ACL deleted successfully for user");
    }
}
