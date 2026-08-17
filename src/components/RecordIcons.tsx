interface BookmarkIconProps {
  filled?: boolean;
  className?: string;
}

export function BookmarkIcon({ filled = false, className = "h-6 w-6" }: BookmarkIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round`}
      aria-hidden="true"
    >
      <path
        d="M6.5 3.5h11v17l-5.5-3.7-5.5 3.7v-17Z"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function NotebookIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 24"
      className={`${className} fill-none stroke-current stroke-[1.7] stroke-linecap-round stroke-linejoin-round`}
      aria-hidden="true"
    >
      <path d="M14 6.2C11.6 4.5 8.7 3.7 4 4v14.2c4.7-.3 7.6.5 10 2.2V6.2Z" />
      <path d="M14 6.2c2.4-1.7 5.3-2.5 10-2.2v14.2c-4.7-.3-7.6.5-10 2.2V6.2Z" />
      <path d="M20.5 4.1v8.2l-1.7-1.2-1.7 1.2V4.7" className="stroke-coral-500" />
    </svg>
  );
}

export function CrownIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} fill-none stroke-current stroke-[1.7] stroke-linecap-round stroke-linejoin-round`}
      aria-hidden="true"
    >
      <path d="m4 8 4.2 3.2L12 5l3.8 6.2L20 8l-1.5 9h-13L4 8Z" />
      <path d="M6 20h12" />
    </svg>
  );
}
