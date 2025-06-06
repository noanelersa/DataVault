package datavault.server.services;

import datavault.server.Repository.AclRepository;
import datavault.server.dto.AclDTO;
import datavault.server.dto.FilePostDTO;
import datavault.server.entities.AclEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import datavault.server.enums.Action;
import datavault.server.exceptions.AclViolationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

import static datavault.server.enums.Action.*;

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

    private static final EnumSet<Action> ALLOW_READ = EnumSet.of(READ, WRITE, MANAGE);
    private static final EnumSet<Action> ALLOW_WRITE = EnumSet.of(WRITE, MANAGE);
    private static final EnumSet<Action> ALLOW_OTHER = EnumSet.of(MANAGE);

    static Map<Action, EnumSet<Action>> ACTION_TO_ALLOW_LIST = new HashMap() {{
        put(READ, ALLOW_READ);
        put(WRITE, ALLOW_WRITE);
        put(MANAGE, ALLOW_OTHER);
        put(SCREENSHOT, ALLOW_OTHER);
        put(DELETE, ALLOW_OTHER);
    }};

    public void newAcl(FileEntity file, List<AclDTO> aclList) {
        List<AclEntity> entities = new ArrayList<>();
        for (AclDTO aclDTO : aclList) {
            UserEntity user = usersService.getUser(aclDTO.username());
            AclEntity acl = new AclEntity(file, user, aclDTO.access());
            entities.add(acl);
        }

        aclRepository.saveAllAndFlush(entities);
    }
    public void updateAcl(FileEntity file, String username, Action newAccessLevel) {
        UserEntity user = usersService.getUser(username);
        Optional<AclEntity> existingAcl = aclRepository.findByFileAndUser(file, user);

        if (existingAcl.isPresent()) {
            AclEntity acl = existingAcl.get();
            acl.setAccessLevel(newAccessLevel);
            acl.setGrantedAt(java.sql.Timestamp.from(java.time.Instant.now()));
            aclRepository.save(acl);
        } else {
            AclEntity newAcl = new AclEntity(file, user, newAccessLevel);
            aclRepository.save(newAcl);
        }
    }
    public void removeAcl(FileEntity file, String username) {
        UserEntity user = usersService.getUser(username);
        Optional<AclEntity> acl = aclRepository.findByFileAndUser(file , user);

        if (acl.isPresent()) {
            aclRepository.delete(acl.get());
        } else {
            throw new RuntimeException("ACL entry not found for user " + username + " on file " + file.getFileId());
        }
    }

    public void checkViolation(FilePostDTO filePostDTO, Action action) {
        UserEntity user = usersService.getUser(filePostDTO.owner());
        FileEntity file = hashService.getFileByHash(filePostDTO.fileHash());
        checkViolation(file, user, action);
    }

    public void checkViolation(FileEntity file, UserEntity user, Action action) {
        Action permission = getUserPermissionForFile(user, file);

        EnumSet<Action> neededPermission = ACTION_TO_ALLOW_LIST.get(action);

        if (permission == null || !neededPermission.contains(permission)) {
            alertService.saveAlert(file, user, action);
            throw new AclViolationException(String.format(
                    "User %s tried to preform %s action on file: '%s'",
                    user.getUsername(), action.name(), file.getFileName()
            ));
        }
    }
    public Action getUserPermissionForFile(UserEntity user, FileEntity file) {
        Optional<AclEntity> aclEntry = aclRepository.findByUserAndFile(user, file);
        return aclEntry.map(AclEntity::getAccessLevel).orElse(null);
    }

    public void deleteAllByFileEntity(FileEntity file) {
        List<AclEntity> aclEntities = aclRepository.findByFile(file);

        aclRepository.deleteAll(aclEntities);
    }

    public List<AclDTO> getAllAclDTOForFile(FileEntity file) {
        List<AclDTO> dtos = new ArrayList<>();

        for (AclEntity entity: aclRepository.findAllByFile(file)) {
            dtos.add(entity.toDto());
        }

        return dtos;
    }

    public List<AclEntity> getAllAclForUser(UserEntity user) {
        return aclRepository.findAllByUser(user);
    }
}
