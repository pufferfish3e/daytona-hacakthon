import { Link } from "react-router-dom";

type CtaButtonProps = {
  className?: string;
  label?: string;
  to?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function CtaButton({
  className = "",
  label = "Revive a project",
  to,
  onClick,
  type = "button",
  disabled = false,
}: CtaButtonProps) {
  const classes = `name-cta-gradient shrink-0 rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 ${className}`;

  if (to) {
    return (
      <Link to={to} className={`inline-flex items-center justify-center ${classes}`}>
        {label}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {label}
    </button>
  );
}

/** @deprecated use CtaButton */
export function GetStartedButton(props: CtaButtonProps) {
  return <CtaButton {...props} />;
}
