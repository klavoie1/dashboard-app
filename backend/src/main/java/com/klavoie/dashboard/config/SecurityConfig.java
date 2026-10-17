package com.klavoie.dashboard.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

@Configuration
@EnableWebSecurity
class SecurityConfig {
    @Bean
    SecurityFilterChain chain(HttpSecurity http, UserDetailsService users,
                              @Value("${app.remember-me-key}") String rememberKey) {
        http
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/login", "/assets/**").permitAll()
                        .anyRequest().authenticated())
                .formLogin(f -> f.defaultSuccessUrl("/", true))
                .rememberMe(r -> r.key(rememberKey).userDetailsService(users)
                        .tokenValiditySeconds(60 * 60 * 24 * 30))
                .logout(Customizer.withDefaults())
                .exceptionHandling(e -> e.defaultAuthenticationEntryPointFor(   // API calls get 401, not a redirect to /login
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                        PathPatternRequestMatcher.withDefaults().matcher("/api/**")))
                .csrf(CsrfConfigurer::spa);   // XSRF-TOKEN cookie for JS clients to echo back as X-XSRF-TOKEN
        return http.build();
    }

    @Bean
    UserDetailsService users(@Value("${app.user}") String user,
                             @Value("${app.password-hash}") String hash) {
        return new InMemoryUserDetailsManager(
                User.withUsername(user).password(hash).roles("OWNER").build());
    }

    @Bean
    PasswordEncoder encoder() { return PasswordEncoderFactories.createDelegatingPasswordEncoder(); }
}