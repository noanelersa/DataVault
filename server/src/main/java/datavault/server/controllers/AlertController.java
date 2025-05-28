package datavault.server.controllers;

import datavault.server.entities.AlertEntity;
import datavault.server.services.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping
    public List<AlertEntity> getAllAlerts() {
        return alertService.getAllAlerts();
    }
    @GetMapping("/user/{username}")
    public List<AlertEntity> getAlertsByUsername(@PathVariable String username) {
        return alertService.getAlertsByUsername(username);
    }

    @GetMapping("/action/{action}")
    public List<AlertEntity> getAlertsByAction(@PathVariable String action) {
        return alertService.getAlertsByAction(action);
    }
    @GetMapping("/severity/{severity}")
    public List<AlertEntity> getAlertsBySeverity(@PathVariable Integer severity) {
        return alertService.getAlertsBySeverity(severity);
    }
    @GetMapping("/file/{fileId}")
    public List<AlertEntity> getAlertsByFile(@PathVariable Long fileId) {
        return alertService.getAlertsByFile(fileId);
    }
}