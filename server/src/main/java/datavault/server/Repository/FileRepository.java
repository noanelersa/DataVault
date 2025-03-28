package datavault.server.Repository;

import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Long> {

    Optional<FileEntity> findByFileId(String fileHash);

    Optional<FileEntity> findByFileName(String filename);

    List<FileEntity> findAllByOwner(UserEntity owner);
}
