package datavault.server.Repository;
import datavault.server.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUserId(Long id);

    UserEntity findByUsername(String username);

    boolean existsByUsername(String username);
}
