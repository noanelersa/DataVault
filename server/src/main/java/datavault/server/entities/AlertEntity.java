package datavault.server.entities;

import datavault.server.enums.Action;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.time.Instant;

@Entity
@Table(name = "alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long alertId;

    @ManyToOne
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private Integer severity;

    private String message;

    @Column(name = "created_at")
    private java.sql.Timestamp createdAt;

    public AlertEntity(FileEntity file, UserEntity user, Action action, String message) {
        this.file = file;
        this.user = user;
        this.action = action.name();
        this.message = message;
        this.severity = action.getSeverity();
        this.createdAt = Timestamp.from(Instant.now());
    }
}
