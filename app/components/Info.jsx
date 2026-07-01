'use client';

export default function Info({ text }) {
  return (
    <span className="info" tabIndex={0}>
      ⓘ
      <span className="infobox">{text}</span>
    </span>
  );
}
