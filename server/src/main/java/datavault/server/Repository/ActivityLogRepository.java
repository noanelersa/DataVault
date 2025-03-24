package datavault.server.Repository;

import datavault.server.entities.ActivityLogEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityLogRepository extends JpaRepository<ActivityLogEntity, Long> {

    // Find all activities for a file
    List<ActivityLogEntity> findByFile(FileEntity file);

    // Find all activities by user
    List<ActivityLogEntity> findByUser(UserEntity user);
}