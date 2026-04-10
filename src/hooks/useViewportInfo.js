'use client';

import { useEffect, useState } from 'react';

const getViewportInfo = () => {
  if (typeof window === 'undefined') {
    return {
      width: 1440,
      height: 900,
      isShortHeight: false,
      isVeryShortHeight: false,
      isNarrowWidth: false,
      isCompactUi: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    width,
    height,
    isShortHeight: height < 900,
    isVeryShortHeight: height < 820,
    isNarrowWidth: width < 1280,
    isCompactUi: height < 900 || width < 1280,
  };
};

export default function useViewportInfo() {
  const [viewportInfo, setViewportInfo] = useState(getViewportInfo);

  useEffect(() => {
    const updateViewportInfo = () => {
      setViewportInfo(getViewportInfo());
    };

    updateViewportInfo();
    window.addEventListener('resize', updateViewportInfo);

    return () => {
      window.removeEventListener('resize', updateViewportInfo);
    };
  }, []);

  return viewportInfo;
}
