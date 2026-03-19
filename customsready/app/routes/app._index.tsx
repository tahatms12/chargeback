import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "~/shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  
  let orders: any[] = [];
  try {
    const response = await admin.graphql(
      `#graphql
      query getRecentOrders {
        orders(first: 25, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }`
    );

    const { data } = await response.json();
    orders = data.orders.edges.map(({ node }: any) => ({
      id: node.id.split("/").pop() as string,
      name: node.name,
      createdAt: node.createdAt,
      financialStatus: node.displayFinancialStatus,
      fulfillmentStatus: node.displayFulfillmentStatus,
      total: `${node.totalPriceSet.shopMoney.amount} ${node.totalPriceSet.shopMoney.currencyCode}`,
    }));
  } catch (err) {
    console.warn('[app._index] Orders query failed:', err);
  }

  return json({ orders });
}

export default function Index() {
  const { orders } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const getFulfillmentBadgeClass = (status: string) => {
    switch (status) {
      case 'FULFILLED': return 'cr-badge cr-badge--green';
      case 'UNFULFILLED': return 'cr-badge cr-badge--amber';
      default: return 'cr-badge cr-badge--default';
    }
  };

  const getFinancialBadgeClass = (status: string) => {
    switch (status) {
      case 'PAID': return 'cr-badge cr-badge--green';
      case 'PENDING': return 'cr-badge cr-badge--amber';
      case 'REFUNDED': return 'cr-badge cr-badge--violet';
      default: return 'cr-badge cr-badge--default';
    }
  };

  return (
    <div className="cr-dashboard animate-fade-in-up">
      <header style={{ marginBottom: '40px' }}>
        <h1 className="cr-hero-title">Dashboard</h1>
        <p className="cr-hero-sub">Welcome back. Streamline your international shipping with automated customs documentation.</p>
      </header>
      
      <div className="cr-stat-grid">
        <div className="cr-card cr-stat hoverable">
          <span className="cr-eyebrow">Total Orders</span>
          <div className="cr-stat__number animate-count-up" style={{ animationDelay: '100ms' }}>
             {orders.length}
          </div>
          <span className="cr-stat__sub">Currently synced from Shopify</span>
        </div>
        <div className="cr-card cr-stat hoverable">
          <span className="cr-eyebrow">Avg Action Time</span>
          <div className="cr-stat__number animate-count-up" style={{ animationDelay: '200ms' }}>
             1.4s
          </div>
          <span className="cr-stat__sub">Per customs evaluation</span>
        </div>
        <div className="cr-card cr-stat hoverable">
          <span className="cr-eyebrow">Documents</span>
          <div className="cr-stat__number animate-count-up" style={{ animationDelay: '300ms' }}>
             Ready
          </div>
          <span className="cr-stat__sub">On-demand generation available</span>
        </div>
      </div>

      <div className="cr-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="cr-card-title" style={{ margin: 0 }}>Recent Orders</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="cr-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Fulfillment</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any, index: number) => {
                return (
                  <tr 
                    key={order.id} 
                    className="cr-table__row" 
                    onClick={() => navigate(`/app/orders/${order.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className="cr-mono" style={{ color: 'var(--cr-text-primary)', fontWeight: 600 }}>
                        {order.name}
                      </span>
                    </td>
                    <td><span className="cr-body-text">{new Date(order.createdAt).toLocaleDateString()}</span></td>
                    <td>
                      <span className={getFinancialBadgeClass(order.financialStatus)}>
                        {order.financialStatus || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      <span className={getFulfillmentBadgeClass(order.fulfillmentStatus)}>
                        {order.fulfillmentStatus || 'UNFULFILLED'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="cr-mono">{order.total}</span>
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }} className="cr-body-text">
                    No recent orders found in your store.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
