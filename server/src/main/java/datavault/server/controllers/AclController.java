package datavault.server.controllers;

import datavault.server.dto.AclDTO;
import datavault.server.entities.FileEntity;
import datavault.server.services.AclService;
import datavault.server.services.FilesService;
import datavault.server.services.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/acl")
public class AclController {
    @Autowired
    private AclService aclService;
    @Autowired
    private FilesService filesService;

    @Autowired
    private PermissionService permissionService;

    @PutMapping("/{fileId}/user/{username}")
    public ResponseEntity<String> updateAclForUser(@PathVariable String fileId, @PathVariable String username,  @RequestBody AclDTO updatedAcl) {
        FileEntity file = filesService.getByFileId(fileId);

        permissionService.validateMenagePermission(file);

        aclService.updateAcl(file, username, updatedAcl.access());
        return ResponseEntity.ok("ACL updated successfully for user");
    }
    @DeleteMapping("/{fileId}/user/{username}")
    public ResponseEntity<String> deleteAclForUser(@PathVariable String fileId, @PathVariable String username) {
        FileEntity file = filesService.getByFileId(fileId);
        permissionService.validateMenagePermission(file);
        aclService.removeAcl(file, username);
        return ResponseEntity.ok("ACL deleted successfully for user");
    }
}
