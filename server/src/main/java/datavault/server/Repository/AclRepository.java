package datavault.server.Repository;

import datavault.server.entities.AclEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface AclRepository extends JpaRepository<AclEntity, Long> {

    // Find permissions for a user on a file
    Optional<AclEntity> findByFileAndUser(FileEntity file, UserEntity user);

    // Find ACL entries by file
    List<AclEntity> findByFile(FileEntity file);

    // Check if user has a specific permission (simplified)
    boolean existsByFileAndUser(FileEntity file, UserEntity user);

    // List of all files the user has access to
    List<AclEntity> findByUser(UserEntity user);

    Optional<AclEntity> findByUserAndFile(UserEntity user, FileEntity file);
}
