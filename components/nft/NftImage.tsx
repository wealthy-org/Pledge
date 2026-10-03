'use client';

import React, { useState, useEffect } from 'react';
import { generateSvgArtwork } from '@/lib/nft-image/tier3-generative';

export interface NftImageProps {
  src?: string | null;
  alt?: string;
  contractAddress?: string;
  tokenId?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  showBadge?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function NftImage({
  src,
  alt = 'NFT Asset',
  contractAddress = '',
  tokenId = '0',
  className = 'w-full h-full object-cover',
  containerClassName = 'relative w-full h-full overflow-hidden bg-slate-900',
  priority = false,
  showBadge = false,
  onLoad,
  onError,
}: NftImageProps) {
  const fallbackSvg = generateSvgArtwork(contractAddress, tokenId);
  const initialSrc = src && src.trim() !== '' ? src : fallbackSvg;

  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(!src || src.trim() === '');

  useEffect(() => {
    if (src && src.trim() !== '') {
      setCurrentSrc(src);
      setIsFallback(false);
      setIsLoaded(false);
    } else {
      setCurrentSrc(fallbackSvg);
      setIsFallback(true);
      setIsLoaded(true);
    }
  }, [src, fallbackSvg]);

  const handleImageError = () => {
    if (!isFallback) {
      setCurrentSrc(fallbackSvg);
      setIsFallback(true);
      setIsLoaded(true);
      if (onError) {
        onError();
      }
    }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    if (onLoad) {
      onLoad();
    }
  };

  return (
    <div className={containerClassName}>
      {!isLoaded && (
        <div
          data-testid="nft-image-skeleton"
          className="absolute inset-0 bg-slate-800 animate-pulse"
        />
      )}
      <img
        src={currentSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        referrerPolicy="no-referrer"
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {showBadge && isFallback && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur border border-slate-700/60 text-[10px] font-medium text-slate-300">
          Generative
        </div>
      )}
    </div>
  );
}
