package datavault.server.Repository;

import datavault.server.entities.AlertEntity;
import datavault.server.entities.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<AlertEntity, Long> {

    List<AlertEntity> findByFile(FileEntity file);

    List<AlertEntity> findBySeverity(Integer severity);
    List<AlertEntity> findByUser_Username(String username);

    List<AlertEntity> findByAction(String action);
}