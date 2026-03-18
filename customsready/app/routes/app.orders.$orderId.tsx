import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { useNavigate } from "@remix-run/react";
import { authenticate } from "~/shopify.server";
import { fetchAndMapOrder } from "~/lib/orderMapper";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const orderId = params.orderId;
  
  if (!orderId) {
    throw new Response("Missing order ID", { status: 400 });
  }

  const invoiceData = await fetchAndMapOrder(admin, orderId);
  return json({ orderId, invoiceData });
}

export default function OrderDetails() {
  const { orderId, invoiceData } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<any>();
  const navigate = useNavigate();
  
  const calculateDuties = () => {
    fetcher.submit(
      { 
        destinationCountry: invoiceData.buyerDetails.country,
        totalValue: invoiceData.totalDeclaredValue,
        currency: invoiceData.currency,
        hsCode: invoiceData.lineItems[0]?.hsCode || ""
      },
      { method: "POST", action: "/app/api/duties", encType: "application/json" }
    );
  };

  const dutyEstimate = fetcher.data?.estimate;
  const isCalculating = fetcher.state !== "idle";

  return (
    <div className="cr-dashboard animate-fade-in-up">
      {/* Header Actions */}
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
           <button className="cr-btn cr-btn--ghost" onClick={() => navigate('/app')} style={{ paddingLeft: 0, marginBottom: '8px' }}>
              &larr; Back to Orders
           </button>
           <h1 className="cr-hero-title" style={{ fontSize: '2rem', marginBottom: '8px' }}>
             Order {invoiceData.orderId}
           </h1>
           <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             <span className="cr-badge cr-badge--violet">Ready for Customs</span>
             <span className="cr-body-text">{invoiceData.buyerDetails.country} Destination</span>
           </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
           <button className="cr-btn cr-btn--secondary" onClick={() => window.open(`/app/api/cn-form/${orderId}`, '_blank')}>
              Generate CN22/CN23
           </button>
           <button className="cr-btn cr-btn--primary" onClick={() => window.open(`/app/api/invoice/${orderId}`, '_blank')}>
              Commercial Invoice
           </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Column (Main Content) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Step Indicators */}
          <div className="cr-card">
            <h2 className="cr-card-title">Documentation Progress</h2>
            <div className="cr-steps-container">
              <div className="cr-step-connector"></div>
              <div className="cr-step cr-step--complete">
                <div className="cr-step-circle">✓</div>
                <div className="cr-step-label">Order Sync</div>
              </div>
              <div className="cr-step cr-step--active">
                <div className="cr-step-circle">2</div>
                <div className="cr-step-label">HS Code Check</div>
              </div>
              <div className="cr-step">
                <div className="cr-step-circle">3</div>
                <div className="cr-step-label">Ready to Print</div>
              </div>
            </div>
          </div>

          <div className="cr-card">
            <h2 className="cr-card-title">Line Items (Customs Info)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="cr-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th>HS Code</th>
                    <th>Origin</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.lineItems.map((item: any, idx: number) => (
                    <tr key={idx} className="cr-table__row">
                      <td><span className="cr-body-text" style={{ color: 'var(--cr-text-primary)' }}>{item.title}</span></td>
                      <td style={{ textAlign: 'center' }}><span className="cr-mono">{item.quantity}</span></td>
                      <td>
                        <span className={item.hsCode ? 'cr-badge cr-badge--blue' : 'cr-badge cr-badge--amber'}>
                           {item.hsCode || "Missing"}
                        </span>
                      </td>
                      <td><span className="cr-mono">{item.countryOfOrigin}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="cr-mono">
                          {item.totalPrice.toFixed(2)} {invoiceData.currency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="cr-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="cr-card-title" style={{ margin: 0 }}>Duty & Tax Estimation</h2>
              <button 
                className="cr-btn cr-btn--secondary" 
                onClick={calculateDuties} 
                disabled={isCalculating}
              >
                {isCalculating ? "Calculating..." : "Calculate Estimate"}
              </button>
            </div>
            
            <p className="cr-body-text" style={{ marginBottom: '24px' }}>
              Destination: <strong style={{ color: '#fff' }}>{invoiceData.buyerDetails.country}</strong> &nbsp;|&nbsp; 
              Declared Value: <strong style={{ color: '#fff' }}>{invoiceData.totalDeclaredValue.toFixed(2)} {invoiceData.currency}</strong>
            </p>

            {isCalculating && !dutyEstimate && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                <div className="cr-skeleton" style={{ width: '100%' }}></div>
                <div className="cr-skeleton" style={{ width: '80%' }}></div>
                <div className="cr-skeleton" style={{ width: '90%' }}></div>
              </div>
            )}

            {dutyEstimate && (
              <div className="animate-fade-in" style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="cr-body-text">Estimated Duties:</span>
                  <span className="cr-mono" style={{ color: '#fff' }}>${(dutyEstimate.dutiesAmount || 0).toFixed(2)} USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="cr-body-text">Estimated Taxes (VAT/GST):</span>
                  <span className="cr-mono" style={{ color: '#fff' }}>${(dutyEstimate.taxesAmount || 0).toFixed(2)} USD</span>
                </div>
                <hr className="cr-divider" style={{ margin: '12px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: 'var(--cr-text-primary)' }}>Total Customs Estimate:</span>
                  <span className="cr-mono" style={{ fontWeight: 700, color: 'var(--cr-success)' }}>
                    ${(dutyEstimate.totalCustomsAmount || 0).toFixed(2)} USD
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Sidebar details) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="cr-card">
            <h2 className="cr-card-title">Destination Address</h2>
            <div className="cr-body-text" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
               <strong style={{ color: '#fff' }}>{invoiceData.buyerDetails.name}</strong>
               <span>{invoiceData.buyerDetails.addressLine1}</span>
               {invoiceData.buyerDetails.addressLine2 && <span>{invoiceData.buyerDetails.addressLine2}</span>}
               <span>{invoiceData.buyerDetails.city}, {invoiceData.buyerDetails.province} {invoiceData.buyerDetails.zip}</span>
               <span style={{ marginTop: '8px', display: 'inline-flex' }}>
                 <span className="cr-badge cr-badge--default">{invoiceData.buyerDetails.country}</span>
               </span>
            </div>
          </div>
          
          <div className="cr-card hoverable">
            <h2 className="cr-card-title">Summary</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="cr-body-text">Items</span>
              <span className="cr-mono">{invoiceData.lineItems.length}</span>
            </div>

            <hr className="cr-divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="cr-body-text" style={{ color: '#fff' }}>Total Value</span>
              <span className="cr-mono" style={{ color: '#fff' }}>{invoiceData.totalDeclaredValue.toFixed(2)} {invoiceData.currency}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
