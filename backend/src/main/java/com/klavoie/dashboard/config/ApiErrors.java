package com.klavoie.dashboard.config;

import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.sqlite.SQLiteException;

import java.util.Map;

@RestControllerAdvice
class ApiErrors {

    // Unknown ids in links (foreign keys) or duplicates, e.g. episode 3 added twice.
    // The SQLite dialect reports these as JpaSystemException, so check the root cause.
    @ExceptionHandler({DataIntegrityViolationException.class, JpaSystemException.class})
    ResponseEntity<Map<String, String>> integrity(RuntimeException e) {
        if (e instanceof JpaSystemException && !isConstraintFailure(e)) throw e;
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "That conflicts with existing data (unknown id or duplicate)."));
    }

    private static boolean isConstraintFailure(Throwable e) {
        return NestedExceptionUtils.getMostSpecificCause(e) instanceof SQLiteException s
                && s.getResultCode().name().startsWith("SQLITE_CONSTRAINT");
    }
}
