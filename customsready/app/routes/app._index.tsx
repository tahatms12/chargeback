import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import { useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  
  let orders: any[] = [];
  try {
    // Query both placed orders AND draft orders so the dashboard
    // is populated even when the store only has drafts.
    const response = await admin.graphql(
      `#graphql
      query getDashboardOrders {
        orders(first: 20, sortKey: CREATED_AT, reverse: true) {
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
        draftOrders(first: 20, query: "tag:CustomsReady_Manual", sortKey: UPDATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              status
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

    const json = await response.json() as any;
    if (json.errors?.length) {
      console.error('[app._index] GraphQL errors:', JSON.stringify(json.errors));
    }

    const placedOrders = (json.data?.orders?.edges ?? []).map(({ node }: any) => ({
      id: node.id.split("/").pop() as string,
      gid: node.id,
      name: node.name,
      createdAt: node.createdAt,
      financialStatus: node.displayFinancialStatus,
      fulfillmentStatus: node.displayFulfillmentStatus,
      total: `${node.totalPriceSet.shopMoney.amount} ${node.totalPriceSet.shopMoney.currencyCode}`,
      isDraft: false,
    }));

    const draftOrders = (json.data?.draftOrders?.edges ?? []).map(({ node }: any) => ({
      id: node.id.split("/").pop() as string,
      gid: node.id,
      name: node.name,
      createdAt: node.createdAt,
      financialStatus: node.status ?? "DRAFT",
      fulfillmentStatus: "UNFULFILLED",
      total: `${node.totalPriceSet?.shopMoney?.amount || "0"} ${node.totalPriceSet?.shopMoney?.currencyCode || "USD"}`,
      isDraft: true,
    }));

    orders = [...placedOrders, ...draftOrders].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 25);

  } catch (err) {
    console.error('[app._index] Orders query failed:', err);
  }

  return json({ orders });
}

export default function Index() {
  const { orders } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const createFetcher = useFetcher<any>();

  useEffect(() => {
    if (createFetcher.state === "idle" && createFetcher.data) {
      if (createFetcher.data.success && createFetcher.data.orderId) {
        navigate(`/app/orders/${createFetcher.data.orderId}`);
      } else if (createFetcher.data.error) {
        (shopify as any).toast.show(createFetcher.data.error, { isError: true });
      }
    }
  }, [createFetcher.state, createFetcher.data, navigate]);

  const handleCreateInvoice = () => {
    createFetcher.submit({}, { method: "POST", action: "/app/api/create-draft-order" });
  };

  const getFulfillmentBadgeClass = (status: string) => {
    switch (status) {
      case 'FULFILLED': return 'cr-badge cr-badge--green';
      case 'UNFULFILLED': return 'cr-badge cr-badge--amber';
      default: return 'cr-badge cr-badge--default';
    }
  };

  const getFinancialBadgeClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'cr-badge cr-badge--green';
      case 'PENDING': return 'cr-badge cr-badge--amber';
      case 'REFUNDED': return 'cr-badge cr-badge--violet';
      case 'DRAFT': return 'cr-badge cr-badge--default';
      default: return 'cr-badge cr-badge--default';
    }
  };

  return (
    <div className="cr-dashboard animate-fade-in-up">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="cr-hero-title">Dashboard</h1>
          <p className="cr-hero-sub">Welcome back. Streamline your international shipping with automated customs documentation.</p>
        </div>
        <button 
          className="cr-btn cr-btn--primary" 
          onClick={handleCreateInvoice}
          disabled={createFetcher.state !== "idle"}
        >
          {createFetcher.state !== "idle" ? "Creating..." : "+ Create Manual Invoice"}
        </button>
      </header>
      
      <div className="cr-stat-grid">
        <div className="cr-card cr-stat hoverable">
          <span className="cr-eyebrow">Total Orders</span>
          <div className="cr-stat__number animate-count-up" style={{ animationDelay: '100ms' }}>
             {orders.length}
          </div>
          <span className="cr-stat__sub">Orders &amp; drafts synced from Shopify</span>
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
              {orders.map((order: any) => {
                return (
                  <tr 
                    key={order.id} 
                    className="cr-table__row" 
                    onClick={() => navigate(order.isDraft ? `/app/orders/draft_${order.id}` : `/app/orders/${order.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className="cr-mono" style={{ color: 'var(--cr-text-primary)', fontWeight: 600 }}>
                        {order.name}
                        {order.isDraft && (
                          <span className="cr-badge cr-badge--default" style={{ marginLeft: '8px', fontSize: '10px' }}>Draft</span>
                        )}
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
