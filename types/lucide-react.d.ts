declare module "lucide-react" {
  import * as React from "react";

  export type LucideProps = React.SVGProps<SVGSVGElement> & {
    size?: string | number;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  };

  export type LucideIcon = React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;

  export const Activity: LucideIcon;
  export const Bot: LucideIcon;
  export const CheckCircle2: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const CircleAlert: LucideIcon;
  export const Database: LucideIcon;
  export const FileSearch: LucideIcon;
  export const History: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const LockKeyhole: LucideIcon;
  export const MessageSquare: LucideIcon;
  export const QrCode: LucideIcon;
  export const Radar: LucideIcon;
  export const Send: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const Terminal: LucideIcon;
  export const Upload: LucideIcon;
}
