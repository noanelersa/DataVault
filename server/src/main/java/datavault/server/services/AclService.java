package datavault.server.services;

import datavault.server.Repository.AclRepository;
import datavault.server.Repository.FileRepository;
import datavault.server.dto.AclDTO;
import datavault.server.dto.FilePostDTO;
import datavault.server.entities.AclEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import datavault.server.enums.Action;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class AclService {
    @Autowired
    AclRepository aclRepository;
    @Autowired
    UsersService usersService;
    @Autowired
    HashService hashService;

    @Autowired
    AlertService alertService;

    public void newAcl(FileEntity file, List<AclDTO> aclList) {
        List<AclEntity> entities = new ArrayList<>();
        for ( AclDTO aclDTO: aclList) {
            UserEntity user = usersService.getUser(aclDTO.username());
            AclEntity acl = new AclEntity(file, user, aclDTO.access());
            entities.add(acl);
        }

        aclRepository.saveAllAndFlush(entities);
    }

    public void checkViolation(FilePostDTO filePostDTO, Action action) {
        UserEntity user = usersService.getUser(filePostDTO.owner());
        FileEntity file = hashService.getFileByHash(filePostDTO.fileHash());
        Action permission = getUserPermissionForFile(user, file);

        if (permission == null || !permission.equals(action)) {
            alertService.saveDuplicateFile(file, user, action);
        }
    }

    public Action getUserPermissionForFile(UserEntity user, FileEntity file) {
        Optional<AclEntity> aclEntry = aclRepository.findByUserAndFile(user, file);
        return aclEntry.map(AclEntity::getAccessLevel).orElse(null);
    }

}
