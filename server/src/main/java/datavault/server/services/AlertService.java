package datavault.server.services;

import datavault.server.Repository.AlertRepository;
import datavault.server.Repository.FileRepository;
import datavault.server.dto.AlertDTO;
import datavault.server.entities.AlertEntity;
import datavault.server.entities.FileEntity;
import datavault.server.entities.UserEntity;
import datavault.server.enums.Action;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlertService {
    @Autowired
    AlertRepository alertRepository;
    @Autowired
    private FileRepository fileRepository;

    public void saveDuplicateFile(FileEntity file, UserEntity user, Action action) {
        AlertEntity alert = new AlertEntity(file, user, action,
                "The user tried to register the file again");

        alertRepository.save(alert);
    }

    public void saveAlert(FileEntity file, UserEntity user, Action action) {
        AlertEntity alert = new AlertEntity(file, user, action,
                "The user violated acl");
        alertRepository.save(alert);
    }

    public List<AlertEntity> getAllAlerts() {
        return alertRepository.findAll();
    }
    public List<AlertEntity> getAlertsByUsername(String username) {
        return alertRepository.findByUser_Username(username);
    }

    public List<AlertEntity> getAlertsByAction(String action) {
        return alertRepository.findByAction(action);
    }
    public List<AlertEntity> getAlertsBySeverity(Integer severity) {
        return alertRepository.findBySeverity(severity);
    }
    public List<AlertEntity> getAlertsByFile(Long fileId) {
        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found with id: " + fileId));
        return alertRepository.findByFile(file);
    }

    public List<AlertDTO> getAlertsDtoForFile(FileEntity file) {
        return alertRepository.findByFile(file).stream().map(alertEntity -> {
            return new AlertDTO(alertEntity.getUser().getUsername(), alertEntity.getAction());
        }).toList();
    }

    public void deleteAllByFileEntity(FileEntity file) {
        List<AlertEntity> alerts = alertRepository.findByFile(file);
        alertRepository.deleteAll(alerts);
    }
}
