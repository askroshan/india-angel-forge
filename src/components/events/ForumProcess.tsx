const steps = [
  {
    step: "1",
    title: "Pre-Event Materials",
    desc: "Members receive pitch decks and exec summaries 48 hours before the forum"
  },
  {
    step: "2",
    title: "Company Presentations",
    desc: "Each startup gets 10 minutes to pitch followed by 15 minutes of Q&A"
  },
  {
    step: "3",
    title: "Member Discussion",
    desc: "Angels gather to discuss opportunities and form diligence pods"
  },
  {
    step: "4",
    title: "Networking",
    desc: "Informal networking session with founders and fellow investors"
  },
  {
    step: "5",
    title: "Follow-up",
    desc: "Interested angels schedule deep-dive sessions with founding teams"
  }
];

export default function ForumProcess() {
  return (
    <div className="space-y-6">
      {steps.map((item, index) => (
        <div key={index} className="flex gap-6 items-start">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent text-accent-foreground font-bold text-xl flex items-center justify-center">
            {item.step}
          </div>
          <div className="pt-2">
            <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
            <p className="text-muted-foreground">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
