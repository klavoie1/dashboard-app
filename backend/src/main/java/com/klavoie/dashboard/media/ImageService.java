package com.klavoie.dashboard.media;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

// Galleries for titles and characters. Files go under MEDIA_ROOT/gallery; episode screenshots are in EpisodeDetails.
@Service
public class ImageService {

    private final GalleryImageRepository images;
    private final ArtworkService artwork;

    ImageService(GalleryImageRepository images, ArtworkService artwork) {
        this.images = images;
        this.artwork = artwork;
    }

    // Which gallery an image goes in
    public record Owner(Long mediaId, Long characterId) {
        public static Owner media(Long id) { return new Owner(id, null); }
        public static Owner character(Long id) { return new Owner(null, id); }
    }

    @Transactional(readOnly = true)
    public List<ImageView> list(Owner owner) {
        List<GalleryImage> found = owner.mediaId() != null
                ? images.findByMediaIdAndEpisodeIdIsNullAndCharacterIdIsNullOrderById(owner.mediaId())
                : images.findByCharacterIdOrderById(owner.characterId());
        return found.stream().map(ImageView::from).toList();
    }

    @Transactional
    public List<ImageView> add(Owner owner, String contentType, byte[] bytes, String caption) throws IOException {
        GalleryImage image = new GalleryImage();
        image.setMediaId(owner.mediaId());
        image.setCharacterId(owner.characterId());
        image.setCaption(caption == null || caption.isBlank() ? null : caption.trim());
        String prefix = owner.mediaId() != null ? "media-" + owner.mediaId() : "character-" + owner.characterId();
        image.setPath(artwork.store("gallery", prefix + "-" + System.currentTimeMillis(), contentType, bytes));
        images.saveAndFlush(image);
        return list(owner);
    }

    public List<ImageView> addFromUrl(Owner owner, String url, String caption) throws IOException, InterruptedException {
        ArtworkService.Downloaded d = artwork.fetch(url);
        return add(owner, d.contentType(), d.bytes(), caption);
    }

    @Transactional
    public ImageView caption(Long id, String caption) {
        GalleryImage image = find(id);
        image.setCaption(caption == null || caption.isBlank() ? null : caption.trim());
        return ImageView.from(images.saveAndFlush(image));
    }

    @Transactional
    public void delete(Long id) throws IOException {
        GalleryImage image = find(id);
        images.delete(image);
        artwork.remove(image.getPath());
    }

    private GalleryImage find(Long id) {
        return images.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No image " + id));
    }
}
