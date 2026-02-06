# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]: "[plugin:vite:react-swc] x Expression expected ,-[/Users/roshanshah/newprojects/indiaangelforum/src/pages/moderator/EventAttendance.tsx:186:1] 183 | <div className=\"min-h-screen flex flex-col\"> 184 | <Navigation /> 185 | <main className=\"flex-1 container mx-auto px-4 py-8\" 186 | <div className=\"mb-6\"> : ^ 187 | <h1 className=\"text-3xl font-bold\">Event Attendance</h1> 188 | <p className=\"text-muted-foreground\">Manage event check-ins and track attendance</p> 189 | </div> `---- x Expected ',', got 'ident' ,-[/Users/roshanshah/newprojects/indiaangelforum/src/pages/moderator/EventAttendance.tsx:186:1] 183 | <div className=\"min-h-screen flex flex-col\"> 184 | <Navigation /> 185 | <main className=\"flex-1 container mx-auto px-4 py-8\" 186 | <div className=\"mb-6\"> : ^^^^^^^^^ 187 | <h1 className=\"text-3xl font-bold\">Event Attendance</h1> 188 | <p className=\"text-muted-foreground\">Manage event check-ins and track attendance</p> 189 | </div> `---- Caused by: Syntax Error"
  - generic [ref=e5]: /Users/roshanshah/newprojects/indiaangelforum/src/pages/moderator/EventAttendance.tsx
  - generic [ref=e6]:
    - text: Click outside, press Esc key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e7]: server.hmr.overlay
    - text: to
    - code [ref=e8]: "false"
    - text: in
    - code [ref=e9]: vite.config.ts
    - text: .
```