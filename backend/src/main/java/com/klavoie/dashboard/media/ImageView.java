package com.klavoie.dashboard.media;

public record ImageView(Long id, String path, String caption, String createdAt) {

    static ImageView from(GalleryImage i) { return new ImageView(i.getId(), i.getPath(), i.getCaption(), i.getCreatedAt()); }
}
