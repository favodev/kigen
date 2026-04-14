import Image from "next/image";

type CoverImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function CoverImage({
  src,
  alt,
  className = "h-full w-full object-cover",
  sizes = "(max-width: 768px) 120px, 200px",
  priority = false,
}: CoverImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={320}
      height={480}
      sizes={sizes}
      className={className}
      priority={priority}
      unoptimized
    />
  );
}
