import type { HTMLAttributes, ReactNode } from "react";

function joinClasses(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  soft?: boolean;
};

export default function Card({ children, className, soft = false, ...rest }: CardProps) {
  return (
    <div className={joinClasses("card", soft && "card--soft", className)} {...rest}>
      {children}
    </div>
  );
}
