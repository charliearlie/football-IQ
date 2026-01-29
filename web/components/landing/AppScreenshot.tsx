import Image from "next/image";
import { cn } from "@/lib/utils";

interface AppScreenshotProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function AppScreenshot({ src, alt, className, priority = false }: AppScreenshotProps) {
  // User feedback: Images already have frames. 
  // We just need a container for layout/sizing without adding another bezel.
  return (
    <div className={cn("relative mx-auto h-[600px] w-[300px]", className)}>
      {/* 
         We keep the container size and apply the drop shadow to the image itself 
         or a wrapper that mimics the shape. 
      */}
      <div className="relative w-full h-full filter drop-shadow-2xl transition-transform duration-500 hover:scale-105">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          priority={priority}
        />
      </div>
    </div>
  );
}
