import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BookOpen, Briefcase, Trophy } from "lucide-react";

const eventTypes = [
  {
    type: "Monthly Forums",
    description: "Regular pitch events where 6-8 curated startups present to our member network",
    frequency: "Monthly",
    format: "Hybrid (In-person + Virtual)",
    icon: Calendar,
  },
  {
    type: "Sector Summits",
    description: "Deep-dive sessions on specific sectors with expert panels and networking",
    frequency: "Quarterly",
    format: "In-person",
    icon: Briefcase,
  },
  {
    type: "Angel Education",
    description: "Workshops and bootcamps on angel investing, due diligence, and portfolio management",
    frequency: "Ongoing",
    format: "Hybrid",
    icon: BookOpen,
  },
  {
    type: "Portfolio Gatherings",
    description: "Exclusive events for our portfolio companies and investor members",
    frequency: "Quarterly",
    format: "In-person",
    icon: Trophy,
  },
];

export default function EventTypeCards() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {eventTypes.map((event, index) => {
        const Icon = event.icon;
        return (
          <Card key={index} className="border-2 hover:border-accent/50 transition-colors">
            <CardContent className="pt-6 space-y-3">
              <Icon className="h-8 w-8 text-accent mb-2" />
              <h3 className="font-semibold text-lg">{event.type}</h3>
              <p className="text-sm text-muted-foreground">{event.description}</p>
              <div className="pt-3 border-t space-y-1 text-xs text-muted-foreground">
                <div>Frequency: {event.frequency}</div>
                <div>Format: {event.format}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
