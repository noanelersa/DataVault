package datavault.server.services;

import datavault.server.Repository.FileRepository;
import datavault.server.dto.AclDTO;
import datavault.server.dto.FileGetDTO;
import datavault.server.dto.FilePostDTO;
import datavault.server.dto.FilePutDTO;
import datavault.server.entities.FileEntity;
import datavault.server.entities.HashEntity;
import datavault.server.entities.UserEntity;
import datavault.server.enums.Action;
import datavault.server.exceptions.FileAlreadyExistsException;
import datavault.server.exceptions.NoSuchFileException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FilesService {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private HashService hashService;

    @Autowired
    private HashService hashService;

    @Autowired
    private UsersService usersService;

    @Autowired
    private AclService aclService;

    public String newFile(FilePostDTO filePostDTO) {
        if (hashService.existsByHash(filePostDTO.fileHash())) {
            aclService.checkViolation(filePostDTO, Action.MANAGE);
            throw new FileAlreadyExistsException("");
        }

        UserEntity user = usersService.getUser(filePostDTO.owner());

        FileEntity file = new FileEntity(filePostDTO.fileName(), user);
        file = this.fileRepository.save(file);
        hashService.saveOriginalHash(file, filePostDTO.fileHash());

        List<AclDTO> acl = filePostDTO.acl();

        acl.add(new AclDTO(filePostDTO.owner(), Action.MANAGE));

        aclService.newAcl(file, acl);

        return file.getFileId();
    }

    public FileEntity getByFileId(String fileID) {
        return fileRepository.findByFileId(fileID).orElse(null);
    }

    public void updateFileHash(FilePutDTO filePutDTO) {
        FileEntity file = hashService.getFileByHash(filePutDTO.originalHash());

        if (file == null) {
            throw new NoSuchFileException();
        }

        UserEntity user = usersService.getUser(filePutDTO.username());
        aclService.checkViolation(file, user, Action.WRITE);

        if (hashService.isHashAlreadyExistsForFile(file.get(), filePutDTO.newHash())) {
            return;
        }

        hashService.saveUpdatedHash(file.get(), filePutDTO.newHash());
    }

    public List<FileGetDTO> getAll() {
        List<FileEntity> files = fileRepository.findAll();

        List<FileGetDTO> dtos = new ArrayList<>();

        for (FileEntity file: files) {
            dtos.add(convertFileEntityToGetDto(file));
        }

        return dtos;
    }

    private FileGetDTO convertFileEntityToGetDto(FileEntity file) {
        HashEntity hash = hashService.findOriginalFileHash(file);
        return new FileGetDTO(file.getFileId(), file.getFileName(), hash.getHash(),
                hash.getTimestamp().toString(), file.getOwner().getUsername());
    }

    public List<FileGetDTO> getAllByUsername(String username) {
        UserEntity user = usersService.getUser(username);
        List<FileEntity> files = fileRepository.findAllByOwner(user);

        List<FileGetDTO> dtos = new ArrayList<>();

        for (FileEntity file: files) {
            dtos.add(convertFileEntityToGetDto(file));
        }

        return dtos;
    }

    public void removeFile(String fileId) {
        FileEntity file = fileRepository.findByFileId(fileId).orElse(null);

        if (file == null) {
            throw new NoSuchFileException();
        }

        hashService.deleteAllByFileEntity(file);
        aclService.deleteAllByFileEntity(file);
        fileRepository.delete(file);
    }
}
