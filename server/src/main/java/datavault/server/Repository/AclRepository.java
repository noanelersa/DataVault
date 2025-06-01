package datavault.server.Repository;

import datavault.server.entities.AclEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import org.apache.catalina.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AclRepository extends JpaRepository<AclEntity, Long> {

    Optional<AclEntity> findByFileAndUser(FileEntity file, UserEntity user);

    List<AclEntity> findByFile(FileEntity file);

    List<AclEntity> findAllByFile(FileEntity file);

    List<AclEntity> findAllByUser(UserEntity user);

    boolean existsByFileAndUser(FileEntity file, UserEntity user);

    List<AclEntity> findByUser(UserEntity user);

    Optional<AclEntity> findByUserAndFile(UserEntity user, FileEntity file);
}
