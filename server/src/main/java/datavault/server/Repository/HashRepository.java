package datavault.server.Repository;

import datavault.server.entities.HashEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HashRepository extends JpaRepository<HashEntity, String> {

    HashEntity findByHash(String hash);
    boolean existsByHash(String hash);
}
