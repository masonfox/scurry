// MessageBanner.jsx
// Displays info, error, or success messages with appropriate styling

export default function MessageBanner({ type = "info", text }) {
  let bg, border, textColor, icon;
  switch (type) {
    case "error":
      bg = "bg-red-100 dark:bg-red-900/20";
      border = "border border-red-300 dark:border-red-800/40";
      textColor = "text-red-900 dark:text-red-300";
      icon = "❌";
      break;
    case "success":
      bg = "bg-green-100 dark:bg-green-900/20";
      border = "border border-green-300 dark:border-green-800/40";
      textColor = "text-green-900 dark:text-green-300";
      icon = "✅";
      break;
    default:
      bg = "bg-blue-100 dark:bg-blue-900/20";
      border = "border border-blue-300 dark:border-blue-800/40";
      textColor = "text-blue-900 dark:text-blue-300";
      icon = "ℹ️";
  }
  return (
    <div className={`my-5 p-4 rounded-md ${bg} ${border} ${textColor} flex items-center gap-2`}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <strong>{text}</strong>
    </div>
  );
}
