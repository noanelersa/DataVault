package datavault.server.services;

import datavault.server.Repository.FileRepository;
import datavault.server.dto.*;
import datavault.server.entities.*;
import datavault.server.enums.Action;
import datavault.server.exceptions.FileAlreadyExistsException;
import datavault.server.exceptions.NoSuchFileException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Service
public class FilesService {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private HashService hashService;

    @Autowired
    private UsersService usersService;

    @Autowired
    private AclService aclService;

    @Autowired
    private AlertService alertService;

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

        if (hashService.isHashAlreadyExistsForFile(file, filePutDTO.newHash())) {
            return;
        }

        hashService.saveUpdatedHash(file, filePutDTO.newHash());
    }

    public List<FileGetDTO> getAll() {
        List<FileEntity> files = fileRepository.findAll();

        List<FileGetDTO> dtos = new ArrayList<>();

        for (FileEntity file: files) {
            dtos.add(convertFileEntityToGetDto(file, true));
        }

        return dtos;
    }

    private FileGetDTO convertFileEntityToGetDto(FileEntity file, Boolean addAlerts) {
        HashEntity hash = hashService.findOriginalFileHash(file);
        List<AclDTO> aclDTOS = aclService.getAllAclDTOForFile(file);

        if (addAlerts) {
            List<AlertDTO> alertEntities = alertService.getAlertsDtoForFile(file);
            return new FileGetDTO(file.getFileId(), file.getFileName(), hash.getHash(),
                    hash.getTimestamp().toString(), file.getOwner().getUsername(), aclDTOS, alertEntities);
        }
        return new FileGetDTO(file.getFileId(), file.getFileName(), hash.getHash(),
                hash.getTimestamp().toString(), file.getOwner().getUsername(), aclDTOS, null);
    }

    public List<FileGetDTO> getAllByUsername(String username) {
        UserEntity user = usersService.getUser(username);
        List<FileEntity> files = fileRepository.findAllByOwner(user);

        List<FileGetDTO> dtos = new ArrayList<>();

        for (FileEntity file: files) {
            dtos.add(convertFileEntityToGetDto(file, true));
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

    public List<FileGetDTO> getMyAvailableFiles(String username) {
        UserEntity user = usersService.getUser(username);
        List<AclEntity> userAcls = aclService.getAllAclForUser(user);

        return userAcls.stream().map(aclEntity -> {
<<<<<<< HEAD
            return convertFileEntityToGetDto(aclEntity.getFile(), false);
=======
            return convertFileEntityToGetDto(aclEntity.getFile());
>>>>>>> b9720c5 (DAT-166 add myRelevantFiles and acl to fileGetDto)
        }).toList();
    }
}
