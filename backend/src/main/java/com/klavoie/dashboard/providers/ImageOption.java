package com.klavoie.dashboard.providers;

// One image a provider offers. width and height are null when the provider doesn't say;
// the server measures those itself before showing them.
public record ImageOption(String provider, String url, Integer width, Integer height, String label) {

    public ImageOption withSize(Integer w, Integer h) { return new ImageOption(provider, url, w, h, label); }
}
