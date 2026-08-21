type ChannelLogoProps = {
  channel:
    | "BOOKING"
    | "AIRBNB"
    | "VRBO"
    | "HORIZON";
  size?: number;
};

export function ChannelLogo({
  channel,
  size = 16,
}: ChannelLogoProps) {
  if (channel === "BOOKING") {
    return (
      <span
        aria-label="Booking.com"
        title="Booking.com"
        style={{
          width: size,
          height: size,
        }}
        className="flex shrink-0 items-center justify-center rounded-[5px] bg-[#003b95] font-black text-white"
      >
        <span
          style={{
            fontSize:
              Math.max(
                7,
                size * 0.48,
              ),
          }}
          className="leading-none"
        >
          B.
        </span>
      </span>
    );
  }

  if (channel === "AIRBNB") {
    return (
      <span
        aria-label="Airbnb"
        title="Airbnb"
        style={{
          width: size,
          height: size,
        }}
        className="flex shrink-0 items-center justify-center text-[#FF385C]"
      >
        <svg
          viewBox="0 0 32 32"
          width={size}
          height={size}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M16 5.5c-2.1 0-3.7 2.8-5.2 6.1-1.8 4-3.9 8.9-6.4 8.9-1.3 0-2.1-1.1-2.1-2.5 0-2.7 2.7-6.5 5.1-9.8C10 4.6 12.5 1.8 16 1.8s6 2.8 8.6 6.4c2.4 3.3 5.1 7.1 5.1 9.8 0 1.4-.8 2.5-2.1 2.5-2.5 0-4.6-4.9-6.4-8.9C19.7 8.3 18.1 5.5 16 5.5Z"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M10.7 17.3c1.4 2.5 3.1 4.4 5.3 4.4s3.9-1.9 5.3-4.4"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  }

  if (channel === "VRBO") {
    return (
      <span
        aria-label="Vrbo"
        title="Vrbo"
        style={{
          width: size,
          height: size,
        }}
        className="flex shrink-0 items-center justify-center rounded-[5px] bg-[#3B2B98] text-white"
      >
        <svg
          viewBox="0 0 24 24"
          width={size * 0.72}
          height={size * 0.72}
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6.5 10.3 18 20 5"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      aria-label="Horizon"
      title="Horizon"
      style={{
        width: size,
        height: size,
      }}
      className="flex shrink-0 items-center justify-center rounded-[6px] bg-[#2563EB] text-white shadow-sm"
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.7}
        height={size * 0.7}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 17V7M19 17V7M5 12h14"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        <path
          d="M12 3v2M12 19v2M3 12h2M19 12h2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          opacity=".75"
        />
      </svg>
    </span>
  );
}

