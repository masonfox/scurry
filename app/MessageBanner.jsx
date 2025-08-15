// MessageBanner.jsx
// Displays info, error, or success messages with appropriate styling

export default function MessageBanner({ type = "info", text }) {
  let bg, border, textColor, icon;
  switch (type) {
    case "error":
      bg = "bg-red-100";
      border = "border border-red-300";
      textColor = "text-red-900";
      icon = "❌";
      break;
    case "success":
      bg = "bg-green-100";
      border = "border border-green-300";
      textColor = "text-green-900";
      icon = "✅";
      break;
    default:
      bg = "bg-blue-100";
      border = "border border-blue-300";
      textColor = "text-blue-900";
      icon = "ℹ️";
  }
  return (
    <div className={`my-5 p-4 rounded-md ${bg} ${border} ${textColor} flex items-center gap-2`}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <strong>{text}</strong>
    </div>
  );
}
