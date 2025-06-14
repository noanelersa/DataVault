package datavault.server.services;

import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import datavault.server.enums.Action;
import datavault.server.exceptions.AclViolationException;
import datavault.server.exceptions.NoSuchFileException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class PermissionService {
    @Autowired
    AclService aclService;

    @Autowired
    FilesService filesService;

    @Autowired
    UsersService usersService;

    public void validateMenagePermissionForFile(Long fileId) {
        FileEntity file = filesService.getByFileId(fileId);
        if (file == null) {
            throw new NoSuchFileException();
        }

        validateMenagePermission(file);
    }

    public void validateMenagePermissionForFile(String fileId) {
        FileEntity file = filesService.getByFileId(fileId);
        if (file == null) {
            throw new NoSuchFileException();
        }

        validateMenagePermission(file);
    }

    public void validateMenagePermission(FileEntity file) {
        validatePermission(file, getAuthenticatedUser(), Action.MANAGE);
    }

    public void validatePermission(FileEntity file, UserEntity user, Action action) {
        if (user.getIsAdmin()) {
            return;
        }

        this.aclService.checkViolation(file, user, action);
    }

    public void validateAccessToDataOfUser(String owner) {
        UserEntity user = getAuthenticatedUser();
        if (user.getIsAdmin() || user.getUsername().equals(owner)) {
            return;
        }

        throw new AclViolationException(String.format(
                "User: %s doesn't have the permission to access the data of: %s",
                user.getUsername(),
                owner
        ));
    }

    public void validateAdmin() {
        UserEntity user = getAuthenticatedUser();
        if (user.getIsAdmin()) {
            return;
        }

        throw new AclViolationException(String.format(
                "The authenticated user: %s tried to access data that only admin is allowed to access," +
                        " but he is not an admin",
                user.getUsername()
        ));
    }

    private String getAuthenticatedUsername() {
        return (String)SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private UserEntity getAuthenticatedUser() {
        return usersService.getUser(getAuthenticatedUsername());
    }
}
