package com.klavoie.dashboard.settings;

import jakarta.persistence.*;

@Entity
@Table(name = "settings")
public class Setting {

    @Id
    private String key;

    private String value;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private String updatedAt;

    protected Setting() {}

    Setting(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public String getKey() { return key; }

    public String getValue() { return value; }

    public void setValue(String value) { this.value = value; }
}
