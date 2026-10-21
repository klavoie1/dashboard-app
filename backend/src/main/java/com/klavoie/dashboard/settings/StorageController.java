package com.klavoie.dashboard.settings;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Stream;

// Where images are kept and how much room they take. The folder is MEDIA_ROOT, which a Docker
// setup mounts as a volume so photos live wherever you choose on the host.
@RestController
class StorageController {

    private static final String[] FOLDERS = {"artwork", "gallery", "episodes", "characters"};

    private final Path root;

    StorageController(@Value("${app.media-root}") String root) { this.root = Path.of(root).toAbsolutePath().normalize(); }

    record Folder(long files, long bytes) {}

    record Storage(String path, boolean writable, long freeBytes, Map<String, Folder> folders) {}

    @GetMapping("/api/settings/storage")
    Storage storage() throws IOException {
        Files.createDirectories(root);
        Map<String, Folder> folders = new LinkedHashMap<>();
        for (String name : FOLDERS) folders.put(name, measure(root.resolve(name)));
        return new Storage(root.toString(), Files.isWritable(root), root.toFile().getUsableSpace(), folders);
    }

    private static Folder measure(Path dir) throws IOException {
        if (!Files.isDirectory(dir)) return new Folder(0, 0);
        try (Stream<Path> files = Files.list(dir)) {
            long[] totals = files.filter(Files::isRegularFile).mapToLong(p -> p.toFile().length())
                    .collect(() -> new long[2], (t, size) -> { t[0]++; t[1] += size; }, (a, b) -> { a[0] += b[0]; a[1] += b[1]; });
            return new Folder(totals[0], totals[1]);
        }
    }
}
