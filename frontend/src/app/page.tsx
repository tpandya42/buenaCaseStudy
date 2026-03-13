import Link from "next/link";
import {
  Building2,
  FileSearch,
  FileText,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardPage() {
  const links = [
    {
      title: "Properties",
      description: "Manage your property portfolio, buildings and units",
      href: "/properties",
      icon: Building2,
    },
    {
      title: "AI Extract",
      description: "Extract structured data from PDF documents",
      href: "/extract",
      icon: FileSearch,
    },
    {
      title: "Documents",
      description: "View uploaded documents and their status",
      href: "/documents",
      icon: FileText,
    },
  ];

  return (
    <div className="p-8 lg:p-10">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Portfolio Insights
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Executive Overview
        </h1>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="group hover:shadow-md transition-all cursor-pointer h-full border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <link.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{link.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4 leading-relaxed">
                  {link.description}
                </CardDescription>
                <span className="text-xs font-semibold text-primary flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                  Open {link.title.toLowerCase()}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properties" value="--" icon={Building2} />
        <StatCard label="Buildings" value="--" icon={TrendingUp} />
        <StatCard label="Units" value="--" icon={Building2} />
        <StatCard label="Documents" value="--" icon={FileText} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
          <Icon className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <p className="text-2xl font-extrabold">{value}</p>
      </CardContent>
    </Card>
  );
}
