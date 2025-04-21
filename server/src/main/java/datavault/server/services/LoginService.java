package datavault.server.services;

import datavault.server.dto.LoginDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ldap.core.support.LdapContextSource;
import org.springframework.stereotype.Service;

@Service
public class LoginService {
    @Value("${spring.ldap.urls}")
    String ldapUrl;

    private final String userDnPattern = "uid=%s,ou=users,dc=datavault,dc=com";

    public Boolean validateCradentials(LoginDTO loginDTO) {
        String userDn = String.format(userDnPattern, loginDTO.username());
        try {
            LdapContextSource contextSource = new LdapContextSource();
            contextSource.setUrl(ldapUrl);
            contextSource.setUserDn(userDn);
            contextSource.setPassword(loginDTO.password());
            contextSource.afterPropertiesSet();

            // Try to get context — this will throw if invalid
            contextSource.getContext(userDn, loginDTO.password());
            return true;
        } catch (Exception e) {
            System.out.println("Authentication failed: " + e.getMessage());
            return false;
        }
    }
}
