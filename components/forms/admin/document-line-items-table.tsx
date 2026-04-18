"use client";

import { calculateDocumentLineTotal, type ClientDocumentLineItem } from "@/lib/client-documents";

type EditableLineItem = ClientDocumentLineItem;

function blankLineItem(index: number): EditableLineItem {
  return {
    id: `local-line-${Date.now()}-${index}`,
    title: "",
    description: null,
    quantity: 1,
    unit_price: 0,
    total_price: 0,
    display_order: index,
  };
}

export default function DocumentLineItemsTable({
  items,
  onChange,
}: {
  items: EditableLineItem[];
  onChange: (next: EditableLineItem[]) => void;
}) {
  function updateItem(id: string, updates: Partial<EditableLineItem>) {
    onChange(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              total_price: calculateDocumentLineTotal(
                updates.quantity ?? item.quantity,
                updates.unit_price ?? item.unit_price
              ),
            }
          : item
      )
    );
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  function addItem() {
    onChange([...items, blankLineItem(items.length)]);
  }

  return (
    <section className="card admin-document-section">
      <div className="admin-document-section-head">
        <div>
          <p className="eyebrow">Line Items</p>
          <h3>Scope & pricing breakdown</h3>
        </div>
        <button type="button" className="btn tertiary" onClick={addItem}>
          Add Line Item
        </button>
      </div>

      <div className="admin-document-table-wrap">
        <table className="admin-document-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      className="input"
                      value={item.title}
                      onChange={(event) =>
                        updateItem(item.id, { title: event.target.value })
                      }
                      placeholder="Item title"
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      value={item.description ?? ""}
                      onChange={(event) =>
                        updateItem(item.id, {
                          description: event.target.value || null,
                        })
                      }
                      placeholder="Description"
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(item.id, {
                          quantity: Number(event.target.value || 0),
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(event) =>
                        updateItem(item.id, {
                          unit_price: Number(event.target.value || 0),
                        })
                      }
                    />
                  </td>
                  <td className="admin-document-money">
                    ${item.total_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn tertiary"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="admin-document-empty">
                  No line items yet. Add the first service or decor scope item.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
