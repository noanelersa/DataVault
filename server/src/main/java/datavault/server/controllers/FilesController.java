package datavault.server.controllers;

import datavault.server.dto.FileGetDTO;
import datavault.server.dto.FilePostDTO;
import datavault.server.dto.FilePutDTO;
import datavault.server.services.FilesService;
import datavault.server.services.PermissionService;
import jakarta.websocket.server.PathParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("file")
public class FilesController {
    @Autowired
    FilesService filesService;
    @Autowired
    PermissionService permissionService;

    @PostMapping
    public ResponseEntity<String> register(@RequestBody FilePostDTO filePostDTO) {
        String fileId = filesService.newFile(filePostDTO);
        return ResponseEntity.ok(fileId);
    }

    @PutMapping
    public ResponseEntity<?> updateFile(@RequestBody FilePutDTO filePutDTO) {
        filesService.updateFileHash(filePutDTO);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<FileGetDTO>> getAllFiles() {
        permissionService.validateAdmin();
        return ResponseEntity.ok(filesService.getAll());
    }

    @GetMapping("/{username}")
    public ResponseEntity<List<FileGetDTO>> getAllFilesByUser(@PathVariable("username") String username) {
        permissionService.validateAccessToDataOfUser(username);
        return ResponseEntity.ok(filesService.getAllByUsername(username));
    }

    @GetMapping("/shared/{username}")
    public ResponseEntity<List<FileGetDTO>> getAllMyFiles(@PathVariable("username") String username) {
        permissionService.validateAccessToDataOfUser(username);
        return ResponseEntity.ok(filesService.getMyAvailableFiles(username));
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<?> removeFile(@PathVariable("fileId") String fileId) {
        permissionService.validateMenagePermissionForFile(fileId);
        filesService.removeFile(fileId);
        return ResponseEntity.ok().build();
    }
}
