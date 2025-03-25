package datavault.server.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "acl")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AclEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "file_id", nullable = false)
    private FileEntity file;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "access_level", nullable = false)
    private String accessLevel;  // "read", "write", "manage"

    @Column(name = "granted_at")
    private java.sql.Timestamp grantedAt;

    public String getPermission() {
        return accessLevel;
    }
}
