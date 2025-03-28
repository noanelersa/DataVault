package datavault.server.Repository;

import datavault.server.entities.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Long> {

    Optional<FileEntity> findByFileId(String fileHash);

    Optional<FileEntity> findByFileName(String filename);

    java.util.List<FileEntity> findAllByOwnerUserId(Long ownerId);     // Find all files owned by a user

}
