package com.mmc.collection.modules.essay.entity.association;

import com.mmc.collection.modules.user.entity.UserDO;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_essay")
public class UserEssayDO {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserDO user;

    @Column(name = "essay_id", length = 20, nullable = false)
    private String essayId;

    @Column(name = "role", length = 20)
    private String role;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}