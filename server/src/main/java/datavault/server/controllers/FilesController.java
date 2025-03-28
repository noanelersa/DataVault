package datavault.server.controllers;

import datavault.server.dto.FileGetDTO;
import datavault.server.dto.FilePostDTO;
import datavault.server.dto.FilePutDTO;
import datavault.server.services.FilesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("file")
public class FilesController {

    @Autowired
    FilesService filesService;

    @PostMapping
    public ResponseEntity<FileGetDTO> register(@RequestBody FilePostDTO filePostDTO) {
        filesService.newFile(filePostDTO);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    public ResponseEntity<?> updateFile(@RequestBody FilePutDTO filePutDTO) {
        filesService.updateFileHash(filePutDTO);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<List<FileGetDTO>> getAllFiles() {
        return ResponseEntity.ok(filesService.getAll());
    }
}
