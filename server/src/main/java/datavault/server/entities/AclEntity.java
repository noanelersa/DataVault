package datavault.server.entities;

import datavault.server.dto.AclDTO;
import datavault.server.enums.Action;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.time.Instant;

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
    @Enumerated(EnumType.STRING)
    private Action accessLevel;

    @Column(name = "granted_at")
    private java.sql.Timestamp grantedAt;

    public AclEntity(FileEntity f, UserEntity u, Action a) {
        this.accessLevel = a;
        this.file = f;
        this.user = u;
        grantedAt = Timestamp.from(Instant.now());
    }

    public AclDTO toDto() {
        return new AclDTO(this.user.getUsername(), this.accessLevel);
    }
}
