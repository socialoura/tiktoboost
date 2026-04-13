interface SectionHeadingProps {
  title: string;
  highlight?: string;
  subtitle?: string;
  center?: boolean;
}

export default function SectionHeading({
  title,
  highlight,
  subtitle,
  center = true,
}: SectionHeadingProps) {
  return (
    <div className={center ? "text-center" : ""}>
      <h2 className="font-heading text-3xl md:text-4xl lg:text-[42px] font-bold text-dark leading-tight">
        {title}{" "}
        {highlight && (
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-dark to-secondary">
            {highlight}
          </span>
        )}
      </h2>
      {subtitle && (
        <p className="font-body text-gray-text text-base md:text-lg mt-4 max-w-3xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
