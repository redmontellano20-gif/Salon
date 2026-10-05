const Brand = ({ name, className = "" }: { name: string; className?: string }) => {
  const chars = [...(name || "").trimEnd()];
  const split = Math.max(chars.length - 1, 0);
  const head = chars.slice(0, split).join("");
  const tail = chars.slice(split).join("") || name;

  return (
    <span className={`font-display leading-none tracking-tight ${className}`}>
      {head}
      <span className="text-rose">{tail}</span>
    </span>
  );
};

export default Brand;
