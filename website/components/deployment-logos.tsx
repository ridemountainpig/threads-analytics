import type { SVGProps } from "react";

function Zeabur(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 294 229" preserveAspectRatio="xMidYMid">
      <path d="M114 145h179v84H0v-84h82l114-61H0V0h293v84l-179 61Z" />
      <path fill="#6300FF" d="M195 0H0v84h195V0Z" />
      <path fill="#F40" d="M293 145H115v84h178v-84Z" />
    </svg>
  );
}

function Railway(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 1024 1024">
      <path
        d="M4.8 438.2A520.7 520.7 0 000 489.7h777.8c-2.7-5.3-6.4-10-10-14.7-133-171.8-204.5-157-306.9-161.3-34-1.4-57.2-2-193-2-72.7 0-151.7.2-228.6.4A621 621 0 0015 386.3h398.6v51.9H4.8zm779.1 103.5H.4c.8 13.8 2.1 27.5 4 41h723.4c32.2 0 50.3-18.3 56.1-41zM45 724.3s120 294.5 466.5 299.7c207 0 385-123 465.9-299.7H45z"
        fill="#000"
      />
      <path
        d="M511.5 0A512.2 512.2 0 0065.3 260.6l202.7-.2c158.4 0 164.2.6 195.2 2l19.1.6c66.7 2.3 148.7 9.4 213.2 58.2 35 26.5 85.6 85 115.7 126.5 27.9 38.5 35.9 82.8 17 125.2-17.5 39-55 62.2-100.4 62.2H16.7s4.2 18 10.6 37.8h970.6a510.4 510.4 0 0026.1-160.7A512.4 512.4 0 00511.5 0z"
        fill="#000"
      />
    </svg>
  );
}

export { Railway, Zeabur };
