package com.klavoie.dashboard.media;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

// Galleries for titles and characters, plus editing or removing any single image
@RestController
@RequestMapping("/api")
class ImageController {

    private final ImageService images;
    private final MediaService media;

    ImageController(ImageService images, MediaService media) {
        this.images = images;
        this.media = media;
    }

    @GetMapping("/media/{id}/images")
    List<ImageView> mediaImages(@PathVariable Long id) {
        media.get(id);
        return images.list(ImageService.Owner.media(id));
    }

    @PostMapping("/media/{id}/images")
    List<ImageView> addMediaImage(@PathVariable Long id, @RequestParam("file") MultipartFile file,
                                  @RequestParam(required = false) String caption) throws IOException {
        media.get(id);
        return images.add(ImageService.Owner.media(id), file.getContentType(), file.getBytes(), caption);
    }

    @PostMapping("/media/{id}/images/from-url")
    List<ImageView> addMediaImageFromUrl(@PathVariable Long id, @RequestBody Map<String, String> body)
            throws IOException, InterruptedException {
        media.get(id);
        return images.addFromUrl(ImageService.Owner.media(id), body.get("url"), body.get("caption"));
    }

    // Character galleries; an unknown character id is rejected by the database's foreign key
    @GetMapping("/characters/{id}/images")
    List<ImageView> characterImages(@PathVariable Long id) { return images.list(ImageService.Owner.character(id)); }

    @PostMapping("/characters/{id}/images")
    List<ImageView> addCharacterImage(@PathVariable Long id, @RequestParam("file") MultipartFile file,
                                      @RequestParam(required = false) String caption) throws IOException {
        return images.add(ImageService.Owner.character(id), file.getContentType(), file.getBytes(), caption);
    }

    @PostMapping("/characters/{id}/images/from-url")
    List<ImageView> addCharacterImageFromUrl(@PathVariable Long id, @RequestBody Map<String, String> body)
            throws IOException, InterruptedException {
        return images.addFromUrl(ImageService.Owner.character(id), body.get("url"), body.get("caption"));
    }

    @PatchMapping("/images/{id}")
    ImageView caption(@PathVariable Long id, @RequestBody Map<String, String> body) { return images.caption(id, body.get("caption")); }

    @DeleteMapping("/images/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@PathVariable Long id) throws IOException { images.delete(id); }
}
