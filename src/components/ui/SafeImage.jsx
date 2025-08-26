"use client";

// Un pequeño Client Component para imágenes con fallback seguro
import React, { useState } from "react";

export default function SafeImage({ src, alt, width = 50, height = 50, style = {}, ...props }) {
  const [imgSrc, setImgSrc] = useState(src || "/placeholder.png");
  return (
    <img
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      style={{ objectFit: "cover", borderRadius: "0.375rem", ...style }}
      onError={() => setImgSrc("/placeholder.png")}
      {...props}
    />
  );
}
