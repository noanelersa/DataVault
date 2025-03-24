package datavault.server.entities;

import jakarta.persistence.*;
import lombok.*;

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
    private Integer severity;  // 1 = low, 3 = high

    private String message;

    @Column(name = "created_at")
    private java.sql.Timestamp createdAt;
}
