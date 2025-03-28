package datavault.server.services;

import datavault.server.Repository.FileRepository;
import datavault.server.Repository.HashRepository;
import datavault.server.dto.AclDTO;
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

import java.util.List;
import java.util.Optional;

@Service
public class FilesService {

    @Autowired
    private FileRepository fileRepository;

    @Autowired
    private HashRepository hashRepository;

    @Autowired
    private UsersService usersService;

    @Autowired
    private AclService aclService;

    public void newFile(FilePostDTO filePostDTO) {
        if (hashRepository.existsByHash(filePostDTO.fileHash())) {
            aclService.checkViolation(filePostDTO, Action.MANAGE);
            throw new FileAlreadyExistsException("");
        }

        UserEntity user = usersService.getUser(filePostDTO.owner());

        FileEntity file = new FileEntity(filePostDTO.fileName(), user);
        file = this.fileRepository.save(file);

        HashEntity hash = new HashEntity(filePostDTO.fileHash(), file);

        hashRepository.save(hash);

        List<AclDTO> acl = filePostDTO.acl();

        acl.add(new AclDTO(filePostDTO.owner(), Action.MANAGE));

        aclService.newAcl(file, acl);
    }

    public void updateFileHash(FilePutDTO filePutDTO) {
        Optional<FileEntity> file = fileRepository.findByFileId(filePutDTO.fileId());

        if (file.isEmpty()) {
            throw new NoSuchFileException();
        }

        UserEntity user = usersService.getUser(filePutDTO.username());
        aclService.checkViolation(file.get(), user, Action.WRITE);

        if (isHashAlreadyExistsForFile(file.get(), filePutDTO.newHash())) {
            return;
        }

        HashEntity newHash = new HashEntity(filePutDTO.newHash(), file.get());
        hashRepository.save(newHash);
    }

    private Boolean isHashAlreadyExistsForFile(FileEntity file, String newHash) {
        List<HashEntity> hashes = hashRepository.findAllByFile(file);

        for (HashEntity hash : hashes) {
            if (hash.getHash().equals(newHash)) {
                return true;
            }
        }

        return false;
    }
}
