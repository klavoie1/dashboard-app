// Rendered as a mask filled with currentColor so the icon follows the text color
export default function Icon({ src, box, className = '' }: { src: string; box: string; className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={`block shrink-0 bg-current ${box} ${className}`}
            style={{
                maskImage: `url(${src})`,
                WebkitMaskImage: `url(${src})`,
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
            }}
        />
    )
}
