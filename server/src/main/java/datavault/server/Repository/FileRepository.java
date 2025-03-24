package datavault.server.Repository;

import datavault.server.entities.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FileRepository extends JpaRepository<FileEntity, Long> {

    Optional<FileEntity> findByFileId(String fileHash);
    Optional<FileEntity> findByFileName(String filename);

    boolean existsByFileHash(String fileHash);

    java.util.List<FileEntity> findAllByOwnerUserId(Long ownerId);     // Find all files owned by a user

}
