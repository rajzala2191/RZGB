// Heavy Step mark — Vrocure brand logo
// Uses currentColor — control colour via Tailwind text-* on the parent element
export default function VrocureLogo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 35 L30 35 L30 65 L54 65 L54 35 L78 35 L78 65 L94 65"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="square"
        strokeLinejoin="miter"
        fill="none"
      />
    </svg>
  );
}
