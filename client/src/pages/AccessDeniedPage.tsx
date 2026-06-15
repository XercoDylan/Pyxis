export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold text-error mb-4">Access Denied</h1>
      <p className="text-neutral-300 text-sm">
        Only Chocolate City members may use this platform.
      </p>
    </div>
  );
}
