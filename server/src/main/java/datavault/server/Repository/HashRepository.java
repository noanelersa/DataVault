package datavault.server.Repository;

import datavault.server.entities.FileEntity;
import datavault.server.entities.HashEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HashRepository extends JpaRepository<HashEntity, String> {

    HashEntity findByHash(String hash);

    boolean existsByHash(String hash);

    List<HashEntity> findAllByFile(FileEntity file);

    HashEntity findByFileAndOriginal(FileEntity file, Boolean original);
}
