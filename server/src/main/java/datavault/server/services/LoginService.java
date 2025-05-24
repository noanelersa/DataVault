package datavault.server.services;

import datavault.server.dto.LoginDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LoginService {
    @Value("${spring.ldap.urls}")
    String ldapUrl;

    private final String userDnPattern = "uid=%s,ou=users,dc=datavault,dc=com";

    public Boolean validateCradentials(LoginDTO loginDTO) {
        log.info("Validating user credentials: {}: {}", loginDTO.username(), loginDTO.password());
        String userDn = String.format(userDnPattern, loginDTO.username());
        log.info(userDn);
        try {
            LdapContextSource contextSource = new LdapContextSource();
            contextSource.setUrl(ldapUrl);
            contextSource.setUserDn(userDn);
            contextSource.setPassword(loginDTO.password());
            contextSource.afterPropertiesSet();
            log.info("Cool - good job");
            // Try to get context — this will throw if invalid
            contextSource.getContext(userDn, loginDTO.password());
            return true;
        } catch (Exception e) {
            log.error("fuck");
            System.out.println("Authentication failed: " + e.getMessage());
            return false;
        }
    }
}
