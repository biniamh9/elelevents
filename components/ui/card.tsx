import type { ElementType, HTMLAttributes, ReactNode } from "react";

function joinClasses(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  soft?: boolean;
  as?: ElementType;
};

export default function Card({
  children,
  className,
  soft = false,
  as: Component = "div",
  ...rest
}: CardProps) {
  return (
    <Component className={joinClasses("card", soft && "card--soft", className)} {...rest}>
      {children}
    </Component>
  );
}
