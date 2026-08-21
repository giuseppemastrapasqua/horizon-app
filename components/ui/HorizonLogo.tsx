import Image from "next/image";

type HorizonLogoProps = {
  compact?: boolean;
  className?: string;
};

export function HorizonLogo({
  compact = false,
  className = "",
}: HorizonLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/brand/horizon-logo.png"
        alt="Horizon"
        width={compact ? 42 : 150}
        height={compact ? 42 : 48}
        priority
        className={
          compact
            ? "h-10 w-10 object-contain"
            : "h-auto w-[150px] object-contain"
        }
      />
    </div>
  );
}
