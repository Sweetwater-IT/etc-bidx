import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertTriangle, Ban, Truck, Wrench } from "lucide-react";

interface TakeoffStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-gray-500/15 text-gray-700",
    icon: Clock,
  },
  sent_to_build_shop: {
    label: "Sent to Build Shop",
    color: "bg-blue-500/15 text-blue-700",
    icon: Truck,
  },
  sent_to_sign_shop: {
    label: "Sent to Sign Shop",
    color: "bg-purple-500/15 text-purple-700",
    icon: Wrench,
  },
  complete: {
    label: "Complete",
    color: "bg-green-500/15 text-green-700",
    icon: CheckCircle2,
  },
  canceled: {
    label: "Canceled",
    color: "bg-red-500/15 text-red-700",
    icon: Ban,
  },
  on_hold: {
    label: "On Hold",
    color: "bg-amber-500/15 text-amber-700",
    icon: AlertTriangle,
  },
};

export const TakeoffStatusBadge = ({ status, className }: TakeoffStatusBadgeProps) => {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    color: "bg-gray-500/15 text-gray-700",
    icon: Clock,
  };

  const Icon = config.icon;

  return (
    <Badge className={`text-[10px] gap-1 ${config.color} ${className || ""}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};