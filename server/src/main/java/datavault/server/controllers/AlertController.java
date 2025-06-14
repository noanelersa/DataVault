package datavault.server.controllers;

import datavault.server.entities.AlertEntity;
import datavault.server.services.AlertService;
import datavault.server.services.PermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;
    @Autowired
    private PermissionService permissionService;

    @GetMapping
    public List<AlertEntity> getAllAlerts() {
        return alertService.getAllAlerts();
    }
    @GetMapping("/user/{username}")
    public List<AlertEntity> getAlertsByUsername(@PathVariable String username) {
        permissionService.validateAccessToDataOfUser(username);
        return alertService.getAlertsByUsername(username);
    }

    @GetMapping("/action/{action}")
    public List<AlertEntity> getAlertsByAction(@PathVariable String action) {
        permissionService.validateAdmin();
        return alertService.getAlertsByAction(action);
    }
    @GetMapping("/severity/{severity}")
    public List<AlertEntity> getAlertsBySeverity(@PathVariable Integer severity) {
        permissionService.validateAdmin();
        return alertService.getAlertsBySeverity(severity);
    }
    @GetMapping("/file/{fileId}")
    public List<AlertEntity> getAlertsByFile(@PathVariable Long fileId) {
        permissionService.validateMenagePermissionForFile(fileId);
        return alertService.getAlertsByFile(fileId);
    }
}