package datavault.server.Repository;

import datavault.server.entities.FileAclEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface FileAclRepository extends JpaRepository<FileAclEntity, Long> {

    // Find permissions for a user on a file
    Optional<FileAclEntity> findByFileAndUser(FileEntity file, UserEntity user);

    // Find ACL entries by file
    List<FileAclEntity> findByFile(FileEntity file);

    // Check if user has a specific permission (simplified)
    boolean existsByFileAndUser(FileEntity file, UserEntity user);

    // List of all files the user has access to
    List<FileAclEntity> findByUser(UserEntity user);

    Optional<FileAclEntity> findByUserAndFile(UserEntity user, FileEntity file);
}
