import Link from "next/link";

import AdminEmptyState from "@/components/admin/admin-empty-state";
import AdminSectionHeader from "@/components/admin/admin-section-header";
import { buildRentalItemCreateHref, buildRentalItemDetailHref } from "@/lib/admin-navigation";
import { formatMoney, formatRentalPrice, type RentalItem } from "@/lib/rental-shared";

export default function RentalManagement({
  items,
}: {
  items: RentalItem[];
}) {
  if (!items.length) {
    return (
      <AdminEmptyState
        eyebrow="Rentals"
        title="No rental items yet"
        description="Start by adding a rental item such as Chiavari chairs, candles, or focal decor so pricing, quantity, and deposit defaults can be managed centrally."
        action={<Link href={buildRentalItemCreateHref()} className="btn">Create rental item</Link>}
      />
    );
  }

  const totalBaseValue = items.reduce((sum, item) => sum + item.base_rental_price, 0);

  return (
    <div className="card admin-table-card admin-records-table-card">
      <AdminSectionHeader
        eyebrow="Rental Inventory"
        title="Manage rental items"
        description="Open an item to edit pricing, images, refundable deposit defaults, and post-rental deposit tracking."
        actions={<Link href={buildRentalItemCreateHref()} className="btn">New rental item</Link>}
      />

      <div className="admin-record-table-shell">
        <table className="admin-records-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Base price</th>
              <th>Quantity</th>
              <th>Deposit</th>
              <th>Status</th>
              <th>Featured</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <div className="admin-table-primary">
                    {item.featured_image_url ? (
                      <img src={item.featured_image_url} alt={item.name} className="rental-admin-thumb" />
                    ) : null}
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.short_description || item.slug}</span>
                    </div>
                  </div>
                </td>
                <td>{item.category || "Uncategorized"}</td>
                <td>{formatRentalPrice(item.base_rental_price, item.price_type)}</td>
                <td>
                  <strong>{item.available_quantity}</strong>
                  <span>Min {item.minimum_order_quantity}</span>
                </td>
                <td>
                  {item.deposit_required ? (
                    <>
                      <strong>
                        {item.deposit_type === "percent"
                          ? `${item.deposit_amount}%`
                          : formatMoney(item.deposit_amount)}
                      </strong>
                      <span>{item.deposit_type.replace(/_/g, " ")}</span>
                    </>
                  ) : (
                    <span>Not required</span>
                  )}
                </td>
                <td>{item.active ? "Active" : "Archived"}</td>
                <td>{item.featured ? "Featured" : "Standard"}</td>
                <td>
                  <Link href={buildRentalItemDetailHref(item.id)} className="admin-record-link">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted">
        {items.length} items listed. Combined starting rental value is {formatMoney(totalBaseValue)}.
      </p>
    </div>
  );
}
