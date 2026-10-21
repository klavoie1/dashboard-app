package com.klavoie.dashboard.media;

import com.klavoie.dashboard.providers.ImageOption;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

// Fills in width and height for images a provider didn't size, by downloading and reading their header.
// Results are remembered, since the same images come up each time you open the picker.
@Component
public class ImageSizes {

    private static final int TIMEOUT_SECONDS = 15;

    private final ArtworkService artwork;
    private final Map<String, int[]> known = new ConcurrentHashMap<>();

    ImageSizes(ArtworkService artwork) { this.artwork = artwork; }

    // Measures what it can and returns them largest first
    public List<ImageOption> largestFirst(List<ImageOption> options) {
        return measure(options).stream()
                .sorted(java.util.Comparator.comparingLong((ImageOption o) -> o.width() == null ? 0 : (long) o.width() * o.height()).reversed())
                .toList();
    }

    List<ImageOption> measure(List<ImageOption> options) {
        List<CompletableFuture<ImageOption>> pending = options.stream().map(o -> o.width() != null && o.height() != null
                ? CompletableFuture.completedFuture(o)
                : CompletableFuture.supplyAsync(() -> {
                    int[] size = known.computeIfAbsent(o.url(), this::read);
                    return size == null ? o : o.withSize(size[0], size[1]);
                })).toList();
        return pending.stream().map(f -> {
            try {
                return f.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            } catch (Exception e) {
                return null;
            }
        }).filter(o -> o != null).toList();
    }

    // Reads only the dimensions; returns null when the image can't be read (e.g. WebP)
    private int[] read(String url) {
        try {
            byte[] bytes = artwork.fetch(url).bytes();
            try (ImageInputStream in = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                var readers = ImageIO.getImageReaders(in);
                if (!readers.hasNext()) return null;
                ImageReader reader = readers.next();
                try {
                    reader.setInput(in);
                    return new int[]{reader.getWidth(0), reader.getHeight(0)};
                } finally {
                    reader.dispose();
                }
            }
        } catch (Exception e) {
            return null;
        }
    }
}
