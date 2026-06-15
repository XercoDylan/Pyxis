import AccessListManager from '../components/admin/AccessListManager';

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-100 mb-6">
        Admin Panel
      </h1>
      <p className="text-neutral-400 text-sm mb-8">
        Manage the Chocolate City member access list. Add or remove MIT Kerberos
        identifiers to control platform access.
      </p>
      <AccessListManager />
    </div>
  );
}
