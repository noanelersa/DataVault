package datavault.server.Repository;

import datavault.server.entities.AlertEntity;
import datavault.server.entities.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<AlertEntity, Long> {

    // Find all alerts for a specific file
    List<AlertEntity> findByFile(FileEntity file);

    // Find all alerts by severity
    List<AlertEntity> findBySeverity(Integer severity);
}