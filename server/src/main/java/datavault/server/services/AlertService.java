package datavault.server.services;

import datavault.server.Repository.AlertRepository;
import datavault.server.entities.AlertEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import datavault.server.enums.Action;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AlertService {
    @Autowired
    AlertRepository alertRepository;

    public void saveDuplicateFile(FileEntity file, UserEntity user, Action action) {
        AlertEntity alert = new AlertEntity(file, user, action, 3,
                "The user tried to register the file again");

        alertRepository.save(alert);
    }
}
