'use client';
import { useTheme } from '@/app/lib/theme-context';

export default function RefautomexLogo({ classAttr = '' }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const multimediaSrc = process.env.NEXT_PUBLIC_S3;

  return (
    <img
      src={
        isDark
          ? `${multimediaSrc}refautomex_bn.svg`
          : `${multimediaSrc}refautomex.svg`
      }
      alt="Refautomex Logo"
      className={classAttr}
      loading="eager"
      decoding="async"
      style={{ transition: "filter 0.3s ease, opacity 0.3s ease" }}
    />
  );
}
