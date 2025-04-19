package datavault.server.controllers;

import datavault.server.entities.AlertEntity;
import datavault.server.services.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping//api/alerts
    public List<AlertEntity> getAllAlerts() {     // Expose Alerts to Agent
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