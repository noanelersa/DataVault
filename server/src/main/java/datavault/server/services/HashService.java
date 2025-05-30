package datavault.server.services;

import datavault.server.Repository.HashRepository;
import datavault.server.entities.FileEntity;
import datavault.server.entities.HashEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HashService {

    @Autowired
    private HashRepository hashRepository;

    public FileEntity getFileByHash(String hash) {
        HashEntity entity = hashRepository.findByHash(hash);

        return entity.getFile();
    }

    public Boolean isHashAlreadyExistsForFile(FileEntity file, String newHash) {
        List<HashEntity> hashes = hashRepository.findAllByFile(file);

        for (HashEntity hash : hashes) {
            if (hash.getHash().equals(newHash)) {
                return true;
            }
        }

        return false;
    }

    public boolean existsByHash(String hash) {
        return hashRepository.existsByHash(hash);
    }

    public void saveOriginalHash(FileEntity file, String hash) {
        HashEntity hashEntity = new HashEntity(hash, file);
        hashEntity.setOriginal(true);

        hashRepository.save(hashEntity);
    }

    public void saveUpdatedHash(FileEntity file, String hash) {
        HashEntity hashEntity = new HashEntity(hash, file);
        hashRepository.save(hashEntity);
    }
    public void deleteAllByFileEntity(FileEntity file) {
        List<HashEntity> hashEntities = hashRepository.findAllByFile(file);

        hashRepository.deleteAll(hashEntities);
    }

    public HashEntity findOriginalFileHash(FileEntity file) {
        return hashRepository.findByFileAndOriginal(file, true);
    }
}
