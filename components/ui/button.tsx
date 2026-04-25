import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary";

function joinClasses(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  arrow?: boolean;
};

type ButtonAsButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLinkProps = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

export default function Button(props: ButtonProps) {
  const variantClass = props.variant === "secondary" ? "secondary" : undefined;
  const className = joinClasses("btn", variantClass, props.arrow && "btn--with-arrow", props.className);

  if ("href" in props && props.href) {
    const { href, children, className: _className, variant, arrow, ...rest } = props as ButtonAsLinkProps;
    return (
      <Link href={href} className={className} {...rest}>
        <span className="btn-label">{children}</span>
        {arrow ? <span className="btn-arrow" aria-hidden="true">→</span> : null}
      </Link>
    );
  }

  const {
    children,
    className: _className,
    variant,
    arrow,
    type = "button",
    ...rest
  } = props as ButtonAsButtonProps;

  return (
    <button type={type as "button" | "submit" | "reset"} className={className} {...rest}>
      <span className="btn-label">{children}</span>
      {arrow ? <span className="btn-arrow" aria-hidden="true">→</span> : null}
    </button>
  );
}
